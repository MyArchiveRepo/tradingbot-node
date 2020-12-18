require('dotenv').config()
const express = require('express')
const port = process.env.PORT;
const app = express()

const TredingService = require('./services/TradingService')

const pair = 'ETHUSDT';
const period = '15m';

let tradingService = new TredingService(app)
tradingService.start(pair, period);

app.listen(port, () => {
    console.log(`Tradingbot app listening at http://localhost:${port}`)
});


