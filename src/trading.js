require('dotenv').config()
const TradingService = require('./services/TradingService');

let trading = new TradingService({
    symbol: process.env.SYMBOL,
    strategy: process.env.STRATEGY,
    period: process.env.PERIOD,
    maPeriod: process.env.MA_PERIOD,
    maMultiplier: process.env.MA_MULTIPLIER,
    atrPeriod: process.env.ATR_PERIOD,
    atrMultiplier: process.env.ATR_MULTIPLIER,
    stopLossPrct: process.env.STOP_LOSS_PRCT,
})

trading.start();