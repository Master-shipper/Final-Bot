import express, { Request, Response } from 'express';

const https = require('https');
const wordDict = require('./word-dictionary');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/webhook', (req: Request, res: Response) => {
    console.log('Received POST request at /webhook');
    console.log('Request body:', req.body); // Log the entire request body

    // Handle Dialogflow intent fulfillment
    if (req.body.queryResult) {
        const intent = req.body.queryResult.intent.displayName;

        switch (intent) {
            case 'Default Welcome Intent':
                welcome(req.body, res);
                break;
            case 'Query Menu':
                queryMenu(req.body, res);
                break;
            case 'Query Recommendation':
                queryRecommendation(req.body, res);
                break;
            default:
                res.json({
                    fulfillmentText: 'Default response from webhook.'
                });
        }
    } else {
        res.status(400).send('Invalid Request!');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

function welcome(body: any, res: Response) {
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

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

function queryMenu(body: any, res: Response) {
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

function queryRecommendation(body: any, res: Response) {
    const recommendationText = "We have the best burger in Irvine. Would you like to try it? Or you can check our menu here:";
    
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
                    subtitle: '4:00 – 7:00 pm\nPacific Ballroom, UC Irvine Student Center',
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
