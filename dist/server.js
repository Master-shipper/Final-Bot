"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const https = require('https');
const wordDict = require('./word-dictionary');
const { queryInfo } = require('./product-info');
const { wordMap } = require('./word-dictionary'); // Import word dictionary
const { parseItem } = require('./parse-item');
const { printItems } = require('./print-items');
const { getCategoryOption, isOptionsConflict, insertOptionsToItem } = require('./insert-options');
const { orderPrice } = require('./order-price');
const { wordsToNumbers } = require('words-to-numbers');
const itemLimit = 50;
const orderLimit = 10;
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.post('/webhook', (req, res) => {
    console.log('Received POST request at /webhook');
    console.log('Request body:', req.body); // Log the entire request body
    // Handle Dialogflow intent fulfillment
    if (req.body.queryResult) {
        const intent = req.body.queryResult.intent.displayName;
        switch (intent) {
            case 'Default Welcome Intent':
                welcome(req.body, res);
                break;
            case 'Place Order':
                placeOrder(req.body, res);
                break;
            case 'Query Menu':
                queryMenu(req.body, res);
                break;
            case 'Query Recommendation':
                queryRecommendation(req.body, res);
                break;
            case 'Query Product':
                queryProduct(req.body, res);
                break;
            case 'Query Word':
                queryWord(req.body, res);
                break;
            default:
                res.json({
                    fulfillmentText: 'Default response from webhook.'
                });
        }
    }
    else {
        res.status(400).send('Invalid Request!');
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
function welcome(body, res) {
    const response = getWelcomeStr();
    res.json({
        fulfillmentText: response
    });
}
function getWelcomeStr() {
    let greet = ["Hi! ", "Hello! "];
    let myName = ["I'm Robo-waiter. ", "My name is Robo-waiter. "];
    let ask = ["What can I get for you today?", "What do you want to eat?"];
    let response = ""
        + greet[getRandomInt(greet.length)]
        + myName[getRandomInt(myName.length)]
        + ask[getRandomInt(ask.length)];
    return response;
}
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
function queryMenu(body, res) {
    const card = {
        card: {
            title: 'MCS Burger – Menu',
            imageUri: 'https://drive.google.com/file/d/13HYF3RaBAzcP4Pn6Ex98YWAPwVWyLvD-/view?usp=sharing',
            subtitle: '4:00 – 7:00 pm\nPacific Ballroom, UON Student Center',
            buttons: [
                {
                    text: 'Check it out',
                    postback: 'https://drive.google.com/file/d/13HYF3RaBAzcP4Pn6Ex98YWAPwVWyLvD-/view?usp=sharing'
                }
            ]
        }
    };
    // Construct JSON response for Dialogflow fulfillment
    res.json({
        fulfillmentMessages: [
            {
                card: card.card
            }
        ]
    });
}
function queryRecommendation(body, res) {
    const recommendationText = "We have the best burger in Nairobi. Would you like to try it? Or you can check our menu here:";
    res.json({
        fulfillmentMessages: [
            {
                text: {
                    text: [recommendationText]
                }
            },
            {
                card: {
                    title: 'MCS Burger – Menu',
                    imageUri: 'https://drive.google.com/file/d/13HYF3RaBAzcP4Pn6Ex98YWAPwVWyLvD-/view?usp=sharing',
                    subtitle: '4:00 – 7:00 pm\nPacific Ballroom, UON Student Center',
                    buttons: [
                        {
                            text: 'Check it out',
                            postback: 'https://drive.google.com/file/d/13HYF3RaBAzcP4Pn6Ex98YWAPwVWyLvD-/view?usp=sharing'
                        }
                    ]
                }
            }
        ]
    });
}
function queryProduct(body, res) {
    const parameters = body.queryResult.parameters;
    const item = parameters.allItem;
    const productAttr = parameters.productAttribute;
    const customerNeed = parameters.customerNeed;
    let response;
    if (customerNeed) {
        response = queryInfo(customerNeed);
    }
    else {
        response = queryInfo(productAttr, item);
    }
    res.json({
        fulfillmentText: response
    });
}
function queryWord(body, res) {
    const parameters = body.queryResult.parameters;
    let response;
    if (parameters.vocabulary) {
        response = wordMap.get(parameters.vocabulary);
    }
    if (parameters.any) {
        response = wordMap.get(parameters.any);
    }
    if (response) {
        res.json({
            fulfillmentText: response
        });
    }
    else {
        res.json({
            fulfillmentText: `Sorry, I never heard ${parameters.any} before. Anything else I can help?`
        });
    }
}
function placeOrder(body, res) {
    let items = body.queryResult.parameters.allProduct; // Assuming this is how you access parameters in your parsed body
    let itemObjects = []; // itemObjects are an array of item objects
    let SF = initSlotFilling();
    let replaceItemParams = getContextParams(body, 'replaceitem');
    let isReplacingItem = replaceItemParams ? replaceItemParams.replaceitem : false;
    for (let item of items) {
        let obj = parseItem(item); // return a js object
        if (obj.category == "drink" && obj.options.length == 0)
            obj.options.push("medium"); // medium by default
        console.log(obj);
        if (!detectSlots(SF, obj))
            itemObjects.push(obj);
    }
    let allItems = getOldItems(body);
    let clarifyItems = false;
    let itemsToClarify = [];
    let length = allItems.length;
    if (length > 0) {
        for (let itemObject of itemObjects) {
            // if the same name but different options => clarify
            if (itemObject.name != "combo"
                && itemObject.name == allItems[length - 1].name
                && !arraysEqual(itemObject.options, allItems[length - 1].options)) {
                clarifyItems = true;
                itemsToClarify.push(itemObject);
            }
            else {
                if (isReplacingItem) {
                    itemObject.amount = allItems[length - 1].amount;
                    allItems[length - 1] = itemObject;
                    deleteContext(body, 'replaceitem');
                }
                else {
                    allItems.push(itemObject);
                }
            }
        }
    }
    else {
        allItems.push.apply(allItems, itemObjects);
    }
    setContext(body, 'order', 5, { order: allItems }); // Resetting the order context with new items
    setDeliveryMethod(body, body.queryResult.parameters.deliveryMethod);
    if (clarifyItems) {
        let clarifyParams = { clarifyitems: itemsToClarify };
        setContext(body, 'clarifyitems', 5, clarifyParams);
        res.json({
            fulfillmentText: `Would you like to modify your ${itemsToClarify[0].name} or add ${itemsToClarify[0].amount} more ${itemsToClarify[0].name}${itemsToClarify[0].name != "fries" && itemsToClarify[0].amount > 1 ? "s" : ""}?`
        });
        return;
    }
    if (clarifyItems || fillSlots(body, SF, res))
        return;
    if (checkEmptyOrder(body, allItems))
        return; // Ensure only two arguments are passed
    confirmAllItems(body, allItems, res);
}
function initSlotFilling() {
    let SF = {
        clarifyBurger: false,
        clarifyShake: false,
        burgerToClarify: [],
        shakeToClarify: []
    };
    return SF;
}
function getContextParams(body, name) {
    let contextName = `projects/${body.session}/contexts/${name}`;
    let context = body.outputContexts ? body.outputContexts.find((ctx) => ctx.name === contextName) : null;
    return context ? context.parameters : undefined;
}
function detectSlots(SF, obj) {
    if (obj.name == "burger" || (obj.name == "combo" && obj.options.length == 0)) {
        SF.clarifyBurger = true;
        SF.burgerToClarify.push(obj);
    }
    else if (obj.name == "shake" && obj.options.length == 0) {
        SF.clarifyShake = true;
        SF.shakeToClarify.push(obj);
    }
    else if (obj.name == "water") {
        // Assuming `body` is a parameter, but it's not defined in the code provided
        // body.add("If you need water, just ask our friendly staff for a plastic cup. It's FREE. Thanks!");
        console.log("If you need water, just ask our friendly staff for a plastic cup. It's FREE. Thanks!");
    }
    else {
        return false;
    }
    return true;
}
function getOldItems(body) {
    let contextName = `projects/${body.session}/contexts/order`;
    let context = body.outputContexts ? body.outputContexts.find((ctx) => ctx.name === contextName) : null;
    if (!context || !context.parameters || !context.parameters.order || context.parameters.order.length === 0) {
        return [];
    }
    return context.parameters.order;
}
function arraysEqual(a1, a2) {
    if (a1.length !== a2.length)
        return false;
    let set = new Set(a1);
    for (let e of a2) {
        if (!set.has(e)) {
            return false;
        }
    }
    return true;
}
function deleteContext(body, name) {
    body.setContext({ 'name': name, 'lifespan': '0' });
}
function resetOrderContext(body, allItems) {
    let newItems = mergeOrder(allItems); // Assuming `mergeOrder` is defined elsewhere
    let parameters = { order: newItems };
    setContext(body, 'order', 999, parameters); // Assuming `setContext` is defined elsewhere
    return newItems;
}
function setDeliveryMethod(body, deliveryMethod) {
    if (deliveryMethod !== "") {
        let deliveryParams = { delivery: deliveryMethod };
        setContext(body, 'delivery', 999, deliveryParams); // Assuming `setContext` is defined elsewhere
    }
}
function setContext(body, name, lifespan, parameters) {
    if (!body.outputContexts) {
        body.outputContexts = [];
    }
    let contextName = `projects/${body.session}/contexts/${name}`;
    let existingContext = body.outputContexts.find((ctx) => ctx.name === contextName);
    if (existingContext) {
        existingContext.lifespanCount = lifespan;
        existingContext.parameters = parameters;
    }
    else {
        body.outputContexts.push({
            name: contextName,
            lifespanCount: lifespan,
            parameters: parameters
        });
    }
}
function fillSlots(body, SF, res) {
    if (SF.clarifyBurger) {
        let burgerParams = { clarifyburger: SF.burgerToClarify };
        setContext(body, 'clarifyburger', 5, burgerParams);
        res.json({
            fulfillmentText: "Which burger would you like? Hamburger, cheeseburger, or MCS?"
        });
        return true;
    }
    if (SF.clarifyShake) {
        let shakeParams = { clarifyshake: SF.shakeToClarify };
        setContext(body, 'clarifyshake', 5, shakeParams);
        res.json({
            fulfillmentText: "What kind of flavor do you want for your shake? We have chocolate, strawberry, and vanilla. All of them are delicious!"
        });
        return true;
    }
    return false;
}
function checkEmptyOrder(body, items) {
    if (items.length === 0) {
        body.response.json({
            fulfillmentText: "Your order is empty. Please add items to your order."
        });
        return true;
    }
    return false;
}
function confirmAllItems(body, allItems, res) {
    let response = '' + getConfirmStr(); // Assuming `getConfirmStr` is defined elsewhere
    response += printItems(allItems); // Assuming `printItems` is defined elsewhere
    response += '. ' + getFollowUpStr(allItems); // Assuming `getFollowUpStr` is defined elsewhere
    res.json({
        fulfillmentText: response
    });
}
function getConfirmStr() {
    let confirm = ['Sure. ', 'No problem. ', 'Gotcha. ', 'Okay. ', 'Of course. ', 'Awesome. '];
    return confirm[getRandomInt(confirm.length)];
}
function getFollowUpStr(allItems) {
    let orderDrink = false;
    // Check if the customer has ordered a drink
    for (let item of allItems) {
        if (item.category !== "burger" && item.category !== "fries") {
            console.log(item);
            orderDrink = true;
            break;
        }
    }
    console.log(orderDrink);
    if (!orderDrink)
        return 'Anything to drink?';
    return getDefaultFollowUpStr();
}
// Utility function: getDefaultFollowUpStr
function getDefaultFollowUpStr() {
    let followUp = ['What else?', 'Anything else?'];
    return followUp[getRandomInt(followUp.length)];
}
function mergeOrder(order) {
    let result = [];
    for (let orderItem of order) {
        let hasPushed = false;
        for (let i = 0; i < result.length; i++) {
            let resultItem = result[i];
            if (orderItem.name !== resultItem.name)
                continue;
            if (arraysEqual(orderItem.options, resultItem.options)) {
                // Same item found, increase amount
                result[i].amount += orderItem.amount;
                hasPushed = true;
            }
        }
        if (!hasPushed) {
            result.push(orderItem);
        }
    }
    // Limit order size, keeping only the latest items
    const orderLimit = 10; // Example order limit, adjust as needed
    if (result.length > orderLimit)
        result.splice(0, result.length - orderLimit);
    // Detect fraudulent deals
    const itemLimit = 5; // Example item limit, adjust as needed
    for (let i = 0; i < result.length; i++) {
        if (result[i].amount > itemLimit) {
            result[i].amount = itemLimit;
            // body.add("Thank you, but we only accept order amount of " + itemLimit + " at most."); // Need to confirm with Kyle
        }
    }
    return result;
}
