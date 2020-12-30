require('dotenv').config()
const fs = require('fs');
const BacktestingingService = require('./services/BacktestingService');


const main = async () => {

    const startTime = new Date(process.env.START_DATE).getTime()
    let endTime = new Date(process.env.END_DATE).getTime()

    const backtesting = new BacktestingingService({
        symbol: process.env.SYMBOL,
        period: process.env.PERIOD,
        maPeriod: process.env.MA_PERIOD,
        maMultiplier: process.env.MA_MULTIPLIER,
        atrPeriod: process.env.ATR_PERIOD,
        atrMultiplier: process.env.ATR_MULTIPLIER,
        isActiveTakeProfit: true,
        takeProfitMult: process.env.TAKE_PROFIT_MULT,
        stopLossPrct: process.env.STOP_LOSS_PRCT,
        strategy: process.env.STRATEGY,
        startTime,
        endTime
    });

    await backtesting.start();

    let csvOrders = "";
    csvOrders = convertToCSV(backtesting.orders);
    fs.writeFileSync(`risultato_backtesting.csv`,csvOrders)
}

 const convertToCSV = (arr) => {
    let array = [Object.keys(arr[0])].concat(arr)
    array = array.slice(1);
    return array.map(it => {
      return Object.values(it).join(';')
    }).join('\n')
}

try {
    main();
} catch (err) {
    console.error(err);
}
