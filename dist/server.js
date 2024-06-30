"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json()); // Add this line to parse JSON bodies
app.get("/", (req, res) => {
    res.send("hello world!");
});
app.post("/webhook", (req, res) => {
    console.log(req.body);
    const agent = req.body.queryResult;
    const action = agent ? agent.action : null;
    if (action === 'input.welcome') { // Match the action name from Dialogflow
        res.json({
            fulfillmentText: getWelcomeStr()
        });
    }
    else {
        res.json({
            fulfillmentText: 'Default response from webhook'
        });
    }
});
app.listen(port, () => {
    console.log(`server is running at port : ${port}`);
});
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
    return Math.floor(Math.random() * max);
}
