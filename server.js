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
    res.send("hello from the webhook");
});
app.listen(port, () => {
    console.log(`server is running at port : ${port}`);
});
