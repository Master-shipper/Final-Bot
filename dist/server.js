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
const bodyParser = require('body-parser');
const itemLimit = 50;
const orderLimit = 10;
const comboComps = new Set(["burger", "fries", "drink"]);
const omsUrl = "https://liyutongordermanagementsystem.herokuapp.com/getOrder/";
let allItems = [];
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
            case 'Add Item':
                addItem(req.body, res);
                break;
            case 'Place Order - Add':
                placeOrderAdd(req.body, res);
                break;
            case 'Place Order - Modify':
                placeOrderModify(req.body, res);
                break;
            case 'Clarify Burger':
                clarifyBurger(req.body, res);
                break;
            case 'Clarify Shake':
                clarifyShake(req.body, res);
                break;
            case 'Modify Item':
                modifyItem(req.body, res);
                break;
            case 'Modify Amount':
                modifyAmount(req.body, res);
                break;
            case 'Remove Item':
                removeItem(req.body, res);
                break;
            case 'Replace Item':
                replaceItem(req.body, res);
                break;
            case 'Finalize Order':
                finalizeOrder(req.body, res);
                break;
            case 'Choose Delivery':
                chooseDelivery(req.body, res);
                break;
            case 'Finalize Order - Choose Delivery':
                finalizeOrderChooseDelivery(req.body, res);
                break;
            case 'Finalize Order - Choose Delivery - Yes':
                finalizeOrderConfirmOrder(req.body, res);
                break;
            case 'Finalize Order - Confirm Order':
                finalizeOrderConfirmOrder(req.body, res);
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
    // Extracting items from the parsed body
    let items = body.queryResult.parameters.allProduct;
    // Initializing an empty array to store item objects
    let itemObjects = [];
    // Initializing slot filling logic
    let SF = initSlotFilling();
    // Checking if there's a 'replaceitem' context and its value
    let replaceItemParams = getContextParams(body, 'replaceitem');
    let isReplacingItem = replaceItemParams ? replaceItemParams.replaceitem : false;
    console.log("Parsed Items:", items);
    console.log("Replace Item :", replaceItemParams);
    // Processing each item extracted from parameters
    for (let item of items) {
        // Parsing the item into a JavaScript object
        let obj = parseItem(item);
        // If the item is a drink and has no options, default to "medium"
        if (obj.category === "drink" && obj.options.length === 0)
            obj.options.push("medium");
        console.log("Processed Item Object:", obj);
        // If the item does not fill any required slots (logic handled by detectSlots function), add it to itemObjects
        if (!detectSlots(SF, obj))
            itemObjects.push(obj);
    }
    console.log("Item Objects after Slot Detection:", itemObjects);
    // Getting previously ordered items from the global allItems array
    console.log("Previous Items:", allItems);
    let clarifyItems = false;
    let itemsToClarify = [];
    let length = allItems.length;
    // Checking against previously ordered items for potential conflicts or replacements
    for (let itemObject of itemObjects) {
        let itemFound = false;
        // Update existing items if replacing
        for (let i = 0; i < allItems.length; i++) {
            if (itemObject.name === allItems[i].name && arraysEqual(itemObject.options, allItems[i].options)) {
                if (isReplacingItem) {
                    allItems[i].amount = itemObject.amount;
                    deleteContext(body, 'replaceitem');
                }
                else {
                    allItems[i].amount += itemObject.amount;
                }
                itemFound = true;
                break;
            }
        }
        // If the same name but different options => clarify
        if (!itemFound) {
            if (length > 0 && itemObject.name !== "combo" && itemObject.name === allItems[length - 1].name && !arraysEqual(itemObject.options, allItems[length - 1].options)) {
                clarifyItems = true;
                itemsToClarify.push(itemObject);
            }
            else {
                allItems.push(itemObject);
            }
        }
    }
    console.log("All Items after Processing:", allItems);
    // Setting the 'order' context with the updated items list
    setContext(body, 'order', 5, { order: allItems });
    // Setting the delivery method based on parameters from the parsed body
    setDeliveryMethod(body, body.queryResult.parameters.deliveryMethod);
    if (clarifyItems) {
        let clarifyParams = { clarifyitems: itemsToClarify };
        setContext(body, 'clarifyitems', 5, clarifyParams);
        res.json({
            fulfillmentText: `Would you like to modify your ${itemsToClarify[0].name} or add ${itemsToClarify[0].amount} more ${itemsToClarify[0].name}${(itemsToClarify[0].name !== "fries" && itemsToClarify[0].amount > 1) ? "s" : ""}?`
        });
        return;
    }
    // If slot filling is not complete, return early
    if (fillSlots(body, SF, res))
        return;
    // Checking if the order is empty; if so, return early
    if (checkEmptyOrder(body, allItems))
        return;
    // Confirming the order with the user
    confirmAllItems(body, allItems, res);
}
function addItem(body, res) {
    let obj = createItemObject(body.queryResult.parameters.allItem, body.queryResult.parameters.itemAmount, 1);
    if (obj.category === "drink" && obj.options.length === 0)
        obj.options.push("medium"); // Set default options for drink
    console.log(obj);
    let SF = initSlotFilling(); // Adjust type if possible
    let oldItems = [...allItems]; // Create a copy of allItems
    if (checkEmptyOrder(body, oldItems))
        return;
    let length = oldItems.length;
    if (length > 0 && oldItems[length - 1].name === obj.name && arraysEqual(obj.options, oldItems[length - 1].options)) {
        oldItems[length - 1].amount += obj.amount; // Increase amount if item already exists with same options
    }
    else if (!detectSlots(SF, obj)) {
        oldItems.push(obj); // Add new item if no slots detected
    }
    oldItems = resetOrderContext(body, oldItems);
    setDeliveryMethod(body, body.queryResult.parameters.deliveryMethod);
    if (fillSlots(body, SF, res))
        return; // Handle slot filling responses
    if (checkEmptyOrder(body, oldItems))
        return;
    confirmAllItems(body, oldItems, res); // Confirm items in the order
}
function placeOrderAdd(body, res) {
    let clarifyContext = getContextParams(body, 'clarifyitems');
    let itemsToClarify = clarifyContext ? clarifyContext.clarifyitems : [];
    deleteContext(body, 'clarifyitems');
    let allItems = body.allItems || [];
    allItems.push(...itemsToClarify); // Use spread operator to push array elements into allItems
    setContext(body, 'order', 5, { order: allItems });
    if (checkEmptyOrder(body, allItems))
        return;
    confirmAllItems(body, allItems, res);
}
function placeOrderModify(body, res) {
    let clarifyContext = getContextParams(body, 'clarifyitems');
    let itemsToClarify = clarifyContext ? clarifyContext.clarifyitems : [];
    deleteContext(body, 'clarifyitems');
    let allItems = body.allItems || [];
    let length = allItems.length;
    if (length < 1) {
        allItems.push(...itemsToClarify); // Use spread operator to push array elements into allItems
    }
    else {
        let i;
        for (i = length - 1; i >= 0; i--) {
            if (allItems[i].name == itemsToClarify[0].name)
                break;
        }
        if (i >= 0) {
            let newOptions = itemsToClarify[0].options;
            let item = allItems[i];
            let categoryOptions = getCategoryOption(newOptions, item);
            if (isOptionsConflict(categoryOptions)) {
                res.json({ fulfillmentText: `Uh... I'm sorry?` });
                return;
            }
            allItems[i] = insertOptionsToItem(item, categoryOptions);
        }
        else {
            allItems.push(...itemsToClarify);
        }
    }
    body.allItems = allItems;
    setContext(body, 'order', 5, { order: allItems });
    if (checkEmptyOrder(body, allItems))
        return;
    confirmAllItems(body, allItems, res);
}
function clarifyBurger(body, res) {
    let oldItems = [...allItems]; // Create a copy of allItems
    let burger = body.queryResult.parameters.comboOption; // Assuming comboOption is directly accessible from body
    let clarifyContext = getContextParams(body, 'clarifyburger');
    let obj;
    if (!clarifyContext || !clarifyContext.parameters || !clarifyContext.parameters.clarifyburger ||
        clarifyContext.parameters.clarifyburger.length === 0) {
        obj = parseItem(burger);
        deleteContext(body, 'clarifyburger');
    }
    else {
        let burgerToClarify = clarifyContext.parameters.clarifyburger;
        console.log(printItems(burgerToClarify));
        obj = burgerToClarify[burgerToClarify.length - 1];
        if (burgerToClarify.length === 1) {
            deleteContext(body, 'clarifyburger');
        }
        else {
            burgerToClarify.pop();
            let burgerParams = { clarifyburger: burgerToClarify };
            setContext(body, 'clarifyburger', 5, burgerParams);
        }
        if (obj.name === "burger") {
            obj.name = burger;
        }
        if (obj.name === "combo") {
            obj.options.push(burger);
        }
    }
    let replaceItemParams = getContextParams(body, 'replaceitem');
    let isReplacingItem = replaceItemParams ? replaceItemParams.replaceitem : false;
    if (isReplacingItem) {
        obj.amount = oldItems[oldItems.length - 1].amount;
        oldItems[oldItems.length - 1] = obj;
        deleteContext(body, 'replaceitem');
    }
    else {
        oldItems.push(obj);
    }
    let newItems = resetOrderContext(body, oldItems);
    if (checkEmptyOrder(body, newItems))
        return;
    confirmAllItems(body, newItems, res);
}
function clarifyShake(body, res) {
    let oldItems = [...allItems]; // Create a copy of allItems
    let shakeOption = body.queryResult.parameters.shakeOption; // Assuming shakeOption is directly accessible from body
    let clarifyContext = getContextParams(body, 'clarifyshake');
    let obj;
    if (!clarifyContext || !clarifyContext.parameters || !clarifyContext.parameters.clarifyshake ||
        clarifyContext.parameters.clarifyshake.length === 0) {
        obj = parseItem(shakeOption + " shake");
        deleteContext(body, 'clarifyshake');
    }
    else {
        let shakeToClarify = clarifyContext.parameters.clarifyshake;
        console.log(printItems(shakeToClarify));
        obj = shakeToClarify[shakeToClarify.length - 1];
        if (shakeToClarify.length === 1) {
            deleteContext(body, 'clarifyshake');
        }
        else {
            shakeToClarify.pop();
            let shakeParams = { clarifyshake: shakeToClarify };
            setContext(body, 'clarifyshake', 5, shakeParams);
        }
        obj.options.push(shakeOption);
    }
    let replaceItemParams = getContextParams(body, 'replaceitem');
    let isReplacingItem = replaceItemParams ? replaceItemParams.replaceitem : false;
    if (isReplacingItem) {
        obj.amount = oldItems[oldItems.length - 1].amount;
        oldItems[oldItems.length - 1] = obj;
        deleteContext(body, 'replaceitem');
    }
    else {
        oldItems.push(obj);
    }
    let newItems = resetOrderContext(body, oldItems);
    if (checkEmptyOrder(body, newItems))
        return;
    confirmAllItems(body, newItems, res);
}
function modifyItem(body, res) {
    // Extract the new options from the request body
    let newOptions = body.queryResult.parameters.allOption; // Assuming allOption is correctly passed in the request
    // Ensure `allItems` is populated from the global context if not already done
    if (allItems.length === 0 && body && body.order && body.order.items) {
        allItems = body.order.items;
    }
    // Check if the order is empty
    if (checkEmptyOrder(body, allItems))
        return;
    let length = allItems.length;
    let itemModified = false;
    // Iterate over items to find a match and modify
    for (let i = length - 1; i >= 0; i--) {
        let modifiedItems = modifyTheItem(allItems[i], newOptions);
        if (modifiedItems.length > 0) {
            allItems.splice(i, 1); // Remove the original item
            allItems.push(...modifiedItems); // Add the modified items
            itemModified = true;
            break;
        }
    }
    // If no items were modified, send a failure response
    if (!itemModified) {
        res.json({ fulfillmentText: `Sorry, that would not work. Could you say that again?` });
        return;
    }
    // Reset the order context and check if the order is empty
    let newItems = resetOrderContext(body, allItems);
    if (checkEmptyOrder(body, newItems))
        return;
    // Confirm all items in the order
    confirmAllItems(body, newItems, res);
}
function modifyTheItem(item, newOptions) {
    let modifiedItems = []; // Explicitly defining modifiedItems as an array of any
    if (item.category === "combo") {
        let comboMap = breakCombo(item);
        let comboModified = false;
        // Iterate over combo components
        for (let category of comboComps) {
            let obj = comboMap.get(category);
            let categoryOptions = getCategoryOption(newOptions, obj);
            // Check for options conflict
            if (isOptionsConflict(categoryOptions))
                return modifiedItems;
            // Modify the combo item if category options are available
            if (categoryOptions.has(category)) {
                obj.options = categoryOptions.get(category);
                obj = sortOptions(obj);
                console.log(obj); // Logging the modified combo object
                comboMap.set(category, obj);
                comboModified = true;
            }
        }
        // If any modification was made, push modified combo components
        if (comboModified) {
            for (let category of comboComps) {
                modifiedItems.push(comboMap.get(category));
            }
        }
    }
    else { // Modify single item
        let categoryOptions = getCategoryOption(newOptions, item);
        // Check for options conflict
        if (isOptionsConflict(categoryOptions))
            return modifiedItems;
        // Modify the item if category options are available
        if (categoryOptions.has(item.category)) {
            item = insertOptionsToItem(item, categoryOptions);
            item = sortOptions(item);
            console.log(item); // Logging the modified single item
            modifiedItems.push(item);
        }
    }
    return modifiedItems;
}
function modifyAmount(body, res) {
    let amount = strToInt(body.queryResult.parameters.itemAmount);
    // Ensure allItems is populated from global context if not already done
    if (allItems.length === 0 && body && body.order && body.order.items) {
        allItems = body.order.items;
    }
    if (checkEmptyOrder(body, allItems))
        return;
    let length = allItems.length;
    if (amount > 0) {
        allItems[length - 1].amount = amount;
    }
    else {
        res.json({ fulfillmentText: `Sorry, that would not work. Could you say that again?` });
        return;
    }
    let newItems = resetOrderContext(body, allItems);
    if (checkEmptyOrder(body, newItems))
        return;
    confirmAllItems(body, newItems, res);
}
function removeItem(body, res) {
    let oldItems = [...allItems]; // Create a copy of allItems
    if (checkEmptyOrder(body, oldItems))
        return;
    let obj = createItemObject(body.queryResult.parameters.allItem, body.queryResult.parameters.itemAmount, 999);
    let tempItems = [];
    for (let item of oldItems) {
        tempItems.push(item);
        if (item.category === "combo") {
            if (item.options[0] === obj.name || obj.name === "burger" || obj.name === "drink" || (obj.name === "fries" && obj.options.length === 0)) {
                tempItems.pop();
                let comboMap = breakCombo(item);
                for (let category of comboComps) {
                    tempItems.push(comboMap.get(category));
                }
            }
        }
    }
    let mergedItems = mergeOrder(tempItems);
    let newItems = [];
    let removed = false;
    for (let item of mergedItems) {
        let reserved = false;
        if (obj.name === "burger" || obj.name === "drink") {
            if (item.category !== obj.name)
                reserved = true;
        }
        else if (item.name !== obj.name) {
            reserved = true;
        }
        else if (isIncludedIn(obj.options, item.options)) {
            if (item.amount - obj.amount > 0) {
                item.amount -= obj.amount;
                reserved = true;
            }
        }
        else {
            reserved = true;
        }
        if (reserved) {
            newItems.push(item);
        }
        else {
            removed = true;
        }
    }
    allItems = resetOrderContext(body, newItems);
    if (!removed) {
        res.json({ fulfillmentText: `Sorry, that would not work. Could you say that again?` });
        return;
    }
    if (checkEmptyOrder(body, allItems))
        return;
    confirmAllItems(body, allItems, res);
}
function replaceItem(body, res) {
    // Ensure allItems is populated from global context if not already done
    if (allItems.length === 0 && body && body.order && body.order.items) {
        allItems = body.order.items;
    }
    if (checkEmptyOrder(body, allItems))
        return;
    let length = allItems.length;
    let lastItem = allItems[length - 1];
    // Dialogflow parameters
    let allProduct = body.queryResult.parameters.allProduct;
    let allOption = body.queryResult.parameters.allOption;
    let newItems;
    let SF = initSlotFilling();
    if (allProduct) {
        let amount = lastItem.amount;
        let obj = parseItem(allProduct);
        if (detectSlots(SF, obj)) {
            let replaceItemParams = { replaceitem: true };
            setContext(body, 'replaceitem', 5, replaceItemParams);
            if (fillSlots(body, SF, res))
                return;
        }
        else {
            allItems[length - 1] = obj; // Replace the last item with the new object
            allItems[length - 1].amount = amount;
            newItems = resetOrderContext(body, allItems);
            if (checkEmptyOrder(body, newItems))
                return;
            confirmAllItems(body, newItems, res);
        }
    }
    else if (allOption) { // Either one of these is defined
        let categoryOptions = getCategoryOption([allOption], lastItem);
        if (isOptionsConflict(categoryOptions)) {
            res.json({ fulfillmentText: `Seems your customized options have conflicts. Could you say that again?` });
            return;
        }
        allItems[length - 1] = insertOptionsToItem(lastItem, categoryOptions);
        allItems[length - 1] = sortOptions(allItems[length - 1]);
        newItems = resetOrderContext(body, allItems);
        if (checkEmptyOrder(body, newItems))
            return;
        confirmAllItems(body, newItems, res);
    }
    else {
        res.json({ fulfillmentText: `I'm sorry, could you say that again?` });
    }
}
function finalizeOrder(body, res) {
    let oldItems = [...allItems]; // Create a copy of allItems
    if (checkEmptyOrder(body, oldItems))
        return;
    let response;
    let deliveryParams = getContextParams(body, 'delivery');
    if (!deliveryParams) {
        response = "Is it for here or to go?";
    }
    else {
        let deliveryMethod = deliveryParams.delivery;
        response = 'So your order will be ' + printItems(oldItems) + ', ' + deliveryMethod + ', right?';
        setDeliveryMethod(body, deliveryMethod); // Ensure delivery method is set
    }
    res.json({ fulfillmentText: response });
}
function finalizeOrderChooseDelivery(body, res) {
    let oldItems = [...allItems]; // Create a copy of allItems
    if (checkEmptyOrder(body, oldItems))
        return;
    let deliveryMethod = body.queryResult.parameters.deliveryMethod;
    setDeliveryMethod(body, deliveryMethod);
    let response = `So your order will be ${printItems(oldItems)}, ${deliveryMethod}, right?`;
    res.json({ fulfillmentText: response });
}
function chooseDelivery(body, res) {
    let delivery = body.queryResult.parameters.deliveryMethod;
    console.log('Delivery Method:', delivery); // Log delivery method to debug
    setDeliveryMethod(body, delivery);
    let confirmStr = getConfirmStr(); // Assuming getConfirmStr() retrieves a confirmation string
    let capitalizedDelivery = capitalizeString(delivery); // Assuming capitalizeString() capitalizes the delivery method
    let defaultFollowUpStr = getDefaultFollowUpStr(); // Assuming getDefaultFollowUpStr() retrieves a follow-up string
    let response = `${confirmStr}${capitalizedDelivery}. ${defaultFollowUpStr}`;
    res.json({ fulfillmentText: response });
}
function finalizeOrderConfirmOrder(body, res) {
    // Check if there are no items in the order
    if (!allItems || allItems.length === 0) {
        console.log("There is no item in the order. What can I get for you today?");
        setContext(body, 'unhappy', 5, { /* parameters object */});
        res.json({ fulfillmentText: "There is no item in the order. What can I get for you today?" });
        return;
    }
    // Generate a unique order ID
    let orderId = generateOrderId();
    // Prepare the response message with order details
    let response = `Your order has been placed with the following details:\n\n${printItems(allItems)}\nOrder ID: ${orderId}\nOrder Time: ${getLocaleTimeString()}\n\nThank you for your order!`;
    // Send the confirmation response to the user
    res.json({ fulfillmentText: response });
    // Clear all items and reset the context
    allItems = []; // Clear the allItems array
    resetOrderContext(body, []); // Reset the order context
    // Clear any other relevant contexts if needed
    deleteContext(body, 'clarifyitems');
    deleteContext(body, 'replaceitem');
    deleteContext(body, 'order');
}
//utility
function generateOrderId() {
    // Generates a random order ID
    return Math.floor(Math.random() * 10000) + 1; // Adjust range as needed
}
function initSlotFilling() {
    const SF = {};
    SF.clarifyBurger = false;
    SF.clarifyShake = false;
    SF.burgerToClarify = [];
    SF.shakeToClarify = [];
    return SF;
}
function getContextParams(body, name) {
    let contextName = `${body.session}/contexts/${name}`;
    let context = body.outputContexts ? body.outputContexts.find((ctx) => ctx.name === contextName) : null;
    return context ? context.parameters : undefined;
}
function detectSlots(SF, obj) {
    if (obj.name === "burger" || (obj.name === "combo" && obj.options.length === 0)) {
        SF.clarifyBurger = true;
        SF.burgerToClarify.push(obj);
    }
    else if (obj.name === "shake" && obj.options.length === 0) {
        SF.clarifyShake = true;
        SF.shakeToClarify.push(obj);
    }
    else if (obj.name === "water") {
        console.log("If you need water, just ask our friendly staff for a plastic cup. It's FREE. Thanks!");
    }
    else {
        return false;
    }
    return true;
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
function sortOptions(obj) {
    if (obj.category !== "burger")
        return obj;
    let str = obj.name;
    for (let option of obj.options) {
        str = str + option + " ";
    }
    let newObj = parseItem(str);
    obj.options = newObj.options;
    return obj;
}
function setContext(body, name, lifespan, parameters) {
    if (!body.outputContexts) {
        body.outputContexts = [];
    }
    let contextName = `${body.session}/contexts/${name}`;
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
function deleteContext(body, name) {
    if (!body.outputContexts)
        return;
    let contextName = `${body.session}/contexts/${name}`;
    let contextIndex = body.outputContexts.findIndex((ctx) => ctx.name === contextName);
    if (contextIndex !== -1) {
        body.outputContexts.splice(contextIndex, 1);
    }
}
function getOldItems(body) {
    let contextName = `${body.session}/contexts/order`;
    let context = body.outputContexts ? body.outputContexts.find((ctx) => ctx.name === contextName) : null;
    return context ? context.parameters.order : [];
}
function breakCombo(combo) {
    let comboMap = new Map();
    if (combo.category !== "combo") {
        comboMap.set(combo.category, combo);
        return comboMap;
    }
    for (let category of comboComps) {
        let obj = {};
        obj.name = category;
        if (category === "burger")
            obj.name = combo.options[0]; // Assume combo burger has been clarified
        obj.category = category;
        obj.options = [];
        if (category === "drink")
            obj.options.push("medium");
        obj.amount = combo.amount;
        comboMap.set(category, obj);
    }
    return comboMap;
}
function isIncludedIn(a1, a2) {
    if (a1.length === 0 && a2.length === 0)
        return true;
    if (a1.length > a2.length)
        return false;
    let set = new Set(a2);
    for (let o of a1) {
        if (!set.has(o)) {
            return false;
        }
    }
    return true;
}
function createItemObject(allItem, itemAmount, defaultAmt) {
    let obj = parseItem(allItem); // Assuming parseItem is defined elsewhere
    let amount;
    if (itemAmount === '') {
        amount = defaultAmt;
    }
    else {
        amount = strToInt(itemAmount); // Assuming strToInt is defined elsewhere
    }
    obj.amount = amount;
    return obj;
}
function strToInt(str) {
    return parseInt(wordsToNumbers(str), 10);
}
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i])
            return false;
    }
    return true;
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
function checkEmptyOrder(body, allItems) {
    const length = allItems.length;
    if (length <= 0) {
        console.log("There is no item in the order. What can I get for you today?");
        // Assuming setContext function handles setting context in your environment
        setContext(body, 'unhappy', 5, { /* parameters object */});
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
function getDefaultFollowUpStr() {
    let followUp = ['What else?', 'Anything else?'];
    return followUp[getRandomInt(followUp.length)];
}
function mergeOrder(items) {
    let result = [];
    for (let item of items) {
        let orderItem = item; // Assume item is already an object
        // If item is a string, parse it
        if (typeof item === 'string') {
            orderItem = parseItem(item);
        }
        if (!orderItem) {
            console.error('Skipping invalid item:', item);
            continue;
        }
        let hasPushed = false;
        for (let i = 0; i < result.length; i++) {
            let resultItem = result[i];
            if (orderItem.name === resultItem.name && arraysEqual(orderItem.options, resultItem.options)) {
                result[i].amount += orderItem.amount;
                hasPushed = true;
                break;
            }
        }
        if (!hasPushed) {
            result.push(orderItem);
        }
    }
    for (let i = 0; i < result.length; i++) {
        if (result[i].amount > itemLimit) {
            result[i].amount = itemLimit;
            console.log(`[Robo-waiter] Thank you, but we only accept order amount of ${itemLimit} at most.`);
        }
    }
    return result;
}
function processOrder(body) {
    let order = body.queryResult.parameters.allProduct;
    for (let item of order) {
        if (item.options.includes('with')) {
            let index = item.options.indexOf('with');
            item.options.splice(index, 1);
        }
    }
    return order;
}
function getLocaleTimeString() {
    // Get current date in UTC
    let date = new Date();
    // Convert to UTC date
    let utcDate = new Date(date.toUTCString());
    // Adjust for UTC-8 (Pacific Standard Time)
    utcDate.setHours(utcDate.getHours() - 8);
    // Convert to US date (PST)
    let usDate = new Date(utcDate);
    // Format and return as local date and time string
    return `${usDate.toLocaleDateString()} ${usDate.toLocaleTimeString()}`;
}
function capitalizeString(str) {
    // Capitalize the first character of the string
    return str.charAt(0).toUpperCase() + str.slice(1);
}
