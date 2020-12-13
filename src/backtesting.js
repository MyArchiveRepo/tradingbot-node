const binance = require('./exchange/binance');
let PairWrapper = require('./classes/PairWrapper');
const { StrategyFactory } = require('./strategies');
const { symbolStrategyController } = require('./controllers');
let Pair = require('./classes/Pair');
const tulind = require('tulind');
const orderStatus = require('./services/orderStatus');
const fs = require('fs');
const { pathToFileURL } = require('url');
const BigNumber = require('bignumber.js').default;

const symbol = 'ETHUSDT';
const period = '3m';
const maPeriod = 200;
const stopLossPrct = 1000000;

const startTime = new Date(2020,10,15).getTime()
let endDate = new Date(2020, 11, 1);
const endTime = endDate.getTime() - 1;

const main = async () => {
     
     let orders = []
     let pairInstance = PairWrapper.add(new Pair(symbol,stopLossPrct));

     let strategyFactory = new StrategyFactory()
     let strategyType = await symbolStrategyController.getStrategyBySymbol(pairInstance.symbol)
     let strategy = strategyFactory.build(strategyType)
     let candlesHistory = await getHistory(symbol, period, startTime, endTime, null);
    
     for (const candle of candlesHistory) {
        
        pairInstance.addCandle(candle);
        let smaResults = await tulind.indicators.sma.indicator([pairInstance.candleCloses],[maPeriod])

        pairInstance.sma = smaResults[0];

        if(pairInstance.stopLoss) {
            let hitStopLoss = pairInstance.checkHitStopLossTest();
            if(hitStopLoss) {
                orders[orders.length - 1].close = BigNumber(pairInstance.stopLoss).toString().replace(".", ",")
                if(pairInstance.orderStatus == orderStatus.BUY_LONG){
                    pairInstance.orderStatus = orderStatus.BUY_CLOSED;
                }
                else pairInstance.orderStatus = orderStatus.SELL_CLOSED;
            }
        }

        let signal = await strategy.getSignal(pairInstance)
        let newOrder = {}

        if (signal) {

            if (signal.isBuy) {
                if(pairInstance.orderStatus !== orderStatus.BUY_LONG &&
                    pairInstance.orderStatus !== orderStatus.BUY_CLOSED ) {

                    pairInstance.orderStatus = orderStatus.BUY_LONG;
                    newOrder = {
                        date: new Date(candle.openTime).toLocaleString(),
                        pair: pairInstance.symbol,
                        bias: 'L',
                        qty: 0,
                        avgPrice: BigNumber(candle.open).toString().replace(".", ","),
                        close: null
                    }
                    if(orders.length>0 && !orders[orders.length - 1].close) {
                        orders[orders.length - 1].close = newOrder.avgPrice
                    }
                    orders.push(newOrder)
                    pairInstance.resetStopLoss();
                }
            }
            else {
                if(pairInstance.orderStatus !== orderStatus.SELL_SHORT &&
                    pairInstance.orderStatus !== orderStatus.SELL_CLOSED ) {

                    pairInstance.orderStatus = orderStatus.SELL_SHORT;

                    newOrder = {
                        date: new Date(candle.openTime).toLocaleString(),
                        pair: pairInstance.symbol,
                        bias: 'S',
                        qty: 0,
                        avgPrice: BigNumber(candle.open).toString().replace(".", ","),
                        close: null
                    }
                    if(orders.length>0&& !orders[orders.length - 1].close) {
                        orders[orders.length - 1].close = newOrder.avgPrice
                    }
                    orders.push(newOrder)
                    pairInstance.resetStopLoss();
                }
            }

        }
     }


    const csvOrders = convertToCSV(orders);

    fs.appendFileSync(`${symbol}_${period}_sma${maPeriod}_SL${stopLossPrct}.csv`,csvOrders)
}

 const convertToCSV = (arr) => {
    let array = [Object.keys(arr[0])].concat(arr)
    array = array.slice(1);
    return array.map(it => {
      return Object.values(it).join(';')
    }).join('\n')
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
