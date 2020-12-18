require('dotenv').config()
const Exchange = require('./exchange/binance');
let PairWrapper = require('./classes/PairWrapper');
const { StrategyFactory } = require('./strategies');
const symbolStrategyController = require('./controllers/symbolStrategyController');
let Pair = require('./classes/Pair');
const tulind = require('tulind');
const orderStatus = require('./services/orderStatus');
const fs = require('fs');
const { pathToFileURL } = require('url');
const BigNumber = require('bignumber.js').default;
BigNumber.config({ DECIMAL_PLACES: 3 })

let binance = new Exchange()
let startQuantity = 100;
const symbol = process.env.SYMBOL;
const period = process.env.PERIOD;
const maPeriod = process.env.MA_PERIOD;
const maMultiplier = process.env.MA_MULTIPLIER;
const atrPeriod = process.env.ATR_PERIOD;
const atrMultiplier = process.env.ATR_MULTIPLIER;
const isActiveTakeProfit = false;
const takeProfitMult = 7;
const stopLossPrct = process.env.STOP_LOSS_PRCT;

const startTime = new Date(process.env.START_DATE).getTime()
let endDate = new Date(process.env.END_DATE);
const endTime = endDate.getTime() - 1;

let newQuantity = null;
const main = async () => {
     
     let orders = []
     let pairInstance = PairWrapper.add(new Pair(symbol,atrMultiplier,takeProfitMult,stopLossPrct));

     let strategyFactory = new StrategyFactory()
     let strategyType = await symbolStrategyController.getStrategyBySymbol(pairInstance.symbol)
     let strategy = strategyFactory.build(strategyType)
     let candlesHistory = await getHistory(symbol, period, startTime, endTime, null);
    
     for (const candle of candlesHistory) {
        
        pairInstance.addCandle(candle);
        let smaResults = await tulind.indicators.sma.indicator([pairInstance.candleCloses],[maPeriod])
        let smaLongResults = await tulind.indicators.sma.indicator([pairInstance.candleCloses],[maPeriod*maMultiplier])

        let atrResults = await tulind.indicators.atr.indicator(
            [pairInstance.candleHighs,pairInstance.candleLows,pairInstance.candleCloses],
            [atrPeriod]
        );

        pairInstance.sma = smaResults[0];
        pairInstance.smaLong = smaLongResults[0];
        //pairInstance.ema = emaResults[0];
        //pairInstance.emaLong = emaLongResults[0];
        pairInstance.atr = atrResults[0];

        let hitAtrStopLoss = pairInstance.checkHitAtrStopLossTest();
        let hitStopLoss = pairInstance.checkHitStopLossTest();
        let hitTakeProfit = pairInstance.checkHitAtrTakeProfitTest();
        if(hitTakeProfit && isActiveTakeProfit){
            orders[orders.length - 1].close = BigNumber(pairInstance.atrTakeProfit).toString().replace(".", ",")
            if(pairInstance.orderStatus == orderStatus.BUY_LONG){
                pairInstance.orderStatus = orderStatus.BUY_CLOSED;
            }
            else pairInstance.orderStatus = orderStatus.SELL_CLOSED;
        }

        if(hitAtrStopLoss || hitStopLoss) {

            switch (pairInstance.orderStatus) {
                case orderStatus.BUY_LONG:
                    pairInstance.waitStatus = pairInstance.getWaitStatus();
                    if(pairInstance.atrStopLoss < pairInstance.stopLoss && hitStopLoss)
                        orders[orders.length - 1].close = BigNumber(pairInstance.stopLoss)
                    else if(pairInstance.atrStopLoss > pairInstance.stopLoss && hitAtrStopLoss)
                        orders[orders.length - 1].close = BigNumber(pairInstance.atrStopLoss)
                    break;
                case orderStatus.SELL_SHORT:
                    pairInstance.waitStatus = pairInstance.getWaitStatus();
                    if(pairInstance.atrStopLoss > pairInstance.stopLoss && hitStopLoss)
                        orders[orders.length - 1].close = BigNumber(pairInstance.stopLoss)
                    else if(pairInstance.atrStopLoss < pairInstance.stopLoss && hitAtrStopLoss)
                        orders[orders.length - 1].close = BigNumber(pairInstance.atrStopLoss)
                    break
                default:
                    break;
            }

            if(pairInstance.orderStatus == orderStatus.BUY_LONG){
                pairInstance.orderStatus = orderStatus.BUY_CLOSED;
            }
            else pairInstance.orderStatus = orderStatus.SELL_CLOSED;

            let close = orders[orders.length - 1].close;
            let open = orders[orders.length - 1].avgPrice;
            let pl = close.minus(open).dividedBy(open).multipliedBy(100);

            if(orders[orders.length - 1].bias == 'S') pl = pl.multipliedBy(-1);

            let preQty = newQuantity ? newQuantity : BigNumber(startQuantity);
            newQuantity = preQty.plus(preQty.dividedBy(100).multipliedBy(pl));
            
            console.log(`${orders[orders.length - 1].date} : ${newQuantity}$ ${pl}%`)
            console.log(`---`)
            continue;

        }

        let signal = await strategy.getSignal(pairInstance)
        let newOrder = {}
        
        if (signal) {

            if (signal.isBuy) {
                if(pairInstance.orderStatus !== orderStatus.BUY_LONG &&
                    pairInstance.orderStatus !== orderStatus.BUY_CLOSED 
                    && ( orders.length == 0 || pairInstance.orderStatus == orderStatus.SELL_CLOSED )
                    ) {
                    pairInstance.orderStatus = orderStatus.BUY_LONG;
                    newOrder = {
                        date: new Date(candle.openTime).toLocaleString(),
                        pair: pairInstance.symbol,
                        bias: 'L',
                        qty: 0,
                        avgPrice: BigNumber(candle.open),
                        close: null,
                    }
                    pairInstance.positionEntry = candle.open;
                    if(orders.length>0 && !orders[orders.length - 1].close) {
                        orders[orders.length - 1].close = newOrder.avgPrice
                    }
                    orders.push(newOrder)
                }
            }
            else {
                if(pairInstance.orderStatus !== orderStatus.SELL_SHORT &&
                    pairInstance.orderStatus !== orderStatus.SELL_CLOSED 
                    && ( orders.length == 0 || pairInstance.orderStatus == orderStatus.BUY_CLOSED )
                    ) {
                    pairInstance.orderStatus = orderStatus.SELL_SHORT;

                    newOrder = {
                        date: new Date(candle.openTime).toLocaleString(),
                        pair: pairInstance.symbol,
                        bias: 'S',
                        qty: 0,
                        avgPrice: BigNumber(candle.open),
                        close: null,
                    }
                    pairInstance.positionEntry = candle.open;
                    if(orders.length>0&& !orders[orders.length - 1].close) {
                        orders[orders.length - 1].close = newOrder.avgPrice
                    }
                    orders.push(newOrder)
                }
            }

        }
     }

    let csvOrders = "";

    
    csvOrders = convertToCSV(orders);


    fs.writeFileSync(`${symbol}_${period}_ema${maPeriod}_SL${stopLossPrct}_ATR_TP_${takeProfitMult}_ATR${atrPeriod}*${atrMultiplier}.csv`,csvOrders)
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
        limit: 1000
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
