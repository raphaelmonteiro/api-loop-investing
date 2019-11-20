const dotenv = require("dotenv").config()
const express = require('express');
const bodyParse = require('body-parser');

const app = express();

app.use(bodyParse.json());
app.use(bodyParse.urlencoded({extended: false}));

app.get('/', (req, res) => {
    res.send('hello world!1');
})

require('./app/controllers')(app)

app.listen(3000, () => {
    console.log('Loop Investing listening on port 3000')
})