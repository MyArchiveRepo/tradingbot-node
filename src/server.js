require('dotenv').config()
const express = require('express')
const tradingRoute = require('./routes/trading/TradingRoute');
const port = process.env.PORT;
const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/trading',tradingRoute)

app.listen(port, () => {
    console.log(`Tradingbot app listening at http://localhost:${port}`)
});

