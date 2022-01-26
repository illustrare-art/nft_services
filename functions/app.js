const express = require("express");
const functions = require("firebase-functions");
const bodyParser = require("body-parser");
const cors = require("cors");

const indexRouter = require("./routes");
const CheckAuth = require("./CheckAuth");
const app = express();

app.use(CheckAuth());
app.use(cors({origin: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(indexRouter);

module.exports = functions.https.onRequest(app);
