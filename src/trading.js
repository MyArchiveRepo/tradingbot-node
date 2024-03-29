require('dotenv').config()
const TradingService = require('./services/TradingService');

let trading = new TradingService({
    symbol: process.env.SYMBOL,
    strategy: process.env.STRATEGY,
    period: process.env.PERIOD,
    maPeriod: process.env.MA_PERIOD,
    maMultiplier: process.env.MA_MULTIPLIER,
    atrPeriod: process.env.ATR_PERIOD,
    takeProfitMult: process.env.TAKE_PROFIT_MULT,
    atrMultiplier: process.env.ATR_MULTIPLIER,
    stopLossPrct: process.env.STOP_LOSS_PRCT,
    positionEntry: process.env.ENTRY,
    positionHigh: process.env.POSITION_HIGH,
    positionLow: process.env.POSITION_LOW,
    orderStatus: process.env.ORDER_STATUS
})

if(/true/.test(process.env.ENABLED)) trading.start();
else console.log("Trading is not enabled")