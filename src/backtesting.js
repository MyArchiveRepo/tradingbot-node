const binance = require('./exchange/binance');
let PairWrapper = require('./classes/PairWrapper');
const { StrategyFactory } = require('./strategies');
const { symbolStrategyController } = require('./controllers');
let Pair = require('./classes/Pair');
const tulind = require('tulind');
const orderStatus = require('./services/orderStatus');


const symbol = 'ETHUSDT';
const period = '15m';
const maPeriod = 10;

const startTime = new Date(2020, 11, 7).getTime()

let endDate = new Date(2020, 11, 9);
const endTime = endDate.getTime() - 1;

const main = async () => {
     

     let pairInstance = PairWrapper.add(new Pair(symbol));

     let strategyFactory = new StrategyFactory()
     let strategyType = await symbolStrategyController.getStrategyBySymbol(pairInstance.symbol)
     let strategy = strategyFactory.build(strategyType)
     let candlesHistory = await getHistory(symbol, period, startTime, endTime, null);
    
     for (const candle of candlesHistory) {
        
        pairInstance.addCandle(candle);
        let smaResults = await tulind.indicators.sma.indicator([pairInstance.candleCloses],[maPeriod])

        pairInstance.sma = smaResults[0];
        let signal = await strategy.getSignal(pairInstance)

        if (signal) {
            let openPrice = pairInstance.candleOpens[pairInstance.candleOpens.length - 1];
            if (signal.isBuy) {
                if(pairInstance.orderStatus !== orderStatus.BUY_LONG) {
                    console.log("BUY " + openPrice);
                    pairInstance.orderStatus = orderStatus.BUY_LONG;
                }
            }
            else {
                if(pairInstance.orderStatus !== orderStatus.SELL_SHORT) {
                    console.log("SELL " + openPrice);
                    pairInstance.orderStatus = orderStatus.SELL_SHORT;
                }
            }

        }
     }
     
}

const getHistory = async (symbol, period, startTime, endTime, candles) => {

    if(!candles) candles = [];

    let newcandles = await binance.client.candles({
        symbol: symbol,
        interval: period,
        startTime: startTime,
        endTime: endTime,
        limit: 300
    });

    let lastClose = newcandles[newcandles.length-1].closeTime
    candles = candles.concat(newcandles);
    if(endTime === lastClose) return candles;

    return await getHistory(symbol, period, lastClose, endTime, candles);
}

try {
    main();
} catch (err) {
    console.error(err);
}
