import express from "express";

const app = express();
const port = 3000;

app.use(express.json()); // Add this line to parse JSON bodies

app.get("/", (req, res) => {
    res.send("hello world!");
})

app.post("/webhook", (req, res) => {
    console.log(req.body);

    const agent = req.body.queryResult;
    const action = agent ? agent.action : null;

    if (action === 'input.welcome') { // Match the action name from Dialogflow
        res.json({
            fulfillmentText: getWelcomeStr()
        });
    } else if (action === 'input.unknown') { // Handle fallback intent
        fallback(agent, res);
    }else {
        res.json({
            fulfillmentText: 'Default response from webhook'
        });
    }
})

app.listen(port, () => {
    console.log(`server is running at port : ${port}`);
    
} )

function fallback(agent: any, res: express.Response) {
    res.json({
        fulfillmentText: `Sorry, could you say that again?`
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

function getRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
}