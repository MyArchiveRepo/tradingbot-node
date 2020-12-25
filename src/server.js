require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const tradingRoute = require('./routes/trading/TradingRoute');
const backtestingRoute = require('./routes/trading/TradingRoute');

const port = process.env.PORT;
const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/trading',tradingRoute)
app.use('/backtesting',backtestingRoute)

app.listen(port, () => {
    console.log(`Tradingbot app listening at http://localhost:${port}`)
});

