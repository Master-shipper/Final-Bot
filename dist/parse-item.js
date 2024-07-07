const itemOptions = require('../item-options');
const itemMap = itemOptions.itemMap;
const burgerIngredients = itemOptions.burgerIngredients;
const optionMap = itemOptions.optionMap;
const { wordsToNumbers } = require('words-to-numbers'); // Module to transform words to numbers

function matchSet(str, set) {
    let match = [];
    for (let element of set) {
        if (str.indexOf(element) !== -1) {
            match.push(element);
        }
    }
    return match;
}

function matchOptions(str, category) {
    let optionSet = optionMap.get(category);
    if (!optionSet) {
        console.log(`[matchOptions] Warning: No options found for category '${category}'`);
        return [];
    }

    let match = [];
    if (category === "other") return match;

    for (let element of optionSet) {
        if (str.indexOf(element) !== -1) {
            match.push(element);
            if (category === "combo" || category === "shake" || category === "drink") {
                break;
            }
        }
    }
    return match;
}

exports.parseItem = function (str) {
    if (typeof str !== 'string') {
        str = String(str); // Convert to string if it's not already
    }

    str = str.replace(/[?]/g, ''); // Remove "?" from the string
    str = wordsToNumbers(str); // Transform words to numbers, e.g., two -> 2

    let obj = {};
    let items = matchSet(str, itemMap.keys()); // Return matched items, maybe more than 1
    obj.name = items.length > 0 ? items[0] : ''; // Use first matched item, or handle if none found
    obj.category = itemMap.get(obj.name);
    obj.options = matchOptions(str, obj.category) || []; // Return matched options, maybe null
    if (obj.category === "burger") {
        let ingredients = matchSet(str, burgerIngredients);
        if (ingredients.length > 0) {
            obj.options.push("with");
            obj.options = obj.options.concat(ingredients);
        }
    }

    // Handle amount based on specific conditions, adjust as necessary
    if (str.toLowerCase().includes("7-up")) {
        obj.amount = 1;
    } else if (!isNaN(parseInt(str, 10))) {
        obj.amount = parseInt(str, 10);
    } else {
        obj.amount = 1; // Default amount if not clearly specified
    }

    console.log(`[parseItem] Input: ${str}, Parsed Item:`, obj); // Logging for debugging

    return obj;
};
