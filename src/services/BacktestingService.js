const Exchange = require('../exchange/binance');
const { StrategyFactory } = require('../strategies');
const symbolStrategyController = require('../controllers/symbolStrategyController');
let Pair = require('../classes/Pair');
const tulind = require('tulind');
const orderStatus = require('./orderStatus');
const BigNumber = require('bignumber.js').default;
BigNumber.config({ DECIMAL_PLACES: 3 })
const PairWrapper = require('../classes/PairWrapper');

class BacktestingingService {

    orders = [];
    quantity = 100;

    constructor(config){
        if(isCorrectConfig(config)){
            this.config = config;
            this.binance = new Exchange()
            PairWrapper.add(new Pair(config));
        }
    }

    async test() {

    }

    async start() {
        
        let candlesHistory = await this.binance.getHistory( 
            this.config.symbol, this.config.period, this.config.startTime, this.config.endTime, null);

        let newQuantity = null;
        for (const candle of candlesHistory) {

            let pairInstance = PairWrapper.get(this.config.symbol)

            pairInstance.addCandle(candle);
            pairInstance.updateHighAndLow(candle);

            await updateIndicators(pairInstance, this.config)
            
            let hitAtrStopLoss = pairInstance.checkHitAtrStopLossTest();
            let hitStopLoss = pairInstance.checkHitStopLossTest();
            let hitTakeProfit = pairInstance.checkHitAtrTakeProfitTest();

            if(hitTakeProfit && this.config.isActiveTakeProfit){
                this.orders[this.orders.length - 1].close = BigNumber(pairInstance.atrTakeProfit)
                if(pairInstance.orderStatus == orderStatus.BUY_LONG){
                    pairInstance.orderStatus = orderStatus.BUY_CLOSED;
                }
                else pairInstance.orderStatus = orderStatus.SELL_CLOSED;
                if(this.orders.length > 0){
                    let preQty = newQuantity ? newQuantity : BigNumber(this.quantity);
                    newQuantity = printToConsole(this.orders, preQty, pairInstance);
                }
                continue;
            }

            if(hitAtrStopLoss || hitStopLoss) {
    
                switch (pairInstance.orderStatus) {
                    case orderStatus.BUY_LONG:
                        if(pairInstance.atrStopLoss < pairInstance.stopLoss && hitStopLoss)
                            this.orders[this.orders.length - 1].close = BigNumber(pairInstance.stopLoss)
                        else if(pairInstance.atrStopLoss > pairInstance.stopLoss && hitAtrStopLoss)
                            this.orders[this.orders.length - 1].close = BigNumber(pairInstance.atrStopLoss)
                        break;
                    case orderStatus.SELL_SHORT:
                        if(pairInstance.atrStopLoss > pairInstance.stopLoss && hitStopLoss)
                            this.orders[this.orders.length - 1].close = BigNumber(pairInstance.stopLoss)
                        else if(pairInstance.atrStopLoss < pairInstance.stopLoss && hitAtrStopLoss)
                            this.orders[this.orders.length - 1].close = BigNumber(pairInstance.atrStopLoss)
                        break
                    default:
                        break;
                }
    
                if(pairInstance.orderStatus == orderStatus.BUY_LONG){
                    pairInstance.orderStatus = orderStatus.BUY_CLOSED;
                }
                else pairInstance.orderStatus = orderStatus.SELL_CLOSED;
                if(this.orders.length > 0){
                    let preQty = newQuantity ? newQuantity : BigNumber(this.quantity);
                    newQuantity = printToConsole(this.orders, preQty, pairInstance);
                }
                continue;
    
            }

            const Strategy = StrategyFactory.build(this.config.strategy)
            const strategy = new Strategy(this.config);

            let signal = await strategy.getSignal();
            if(signal && signal.isBuy && checkEntryLongConditions(this.orders,pairInstance)) {
                pairInstance.orderStatus = orderStatus.BUY_LONG;    
                pairInstance.positionEntry = candle.open;  
                pairInstance.positionHigh = candle.open;
                pairInstance.positionLow = candle.open;
                this.orders.push(getNewOrder(candle,pairInstance.symbol,'L'))
            }
            if(signal && !signal.isBuy && checkEntryShortConditions(this.orders,pairInstance)) {
                pairInstance.orderStatus = orderStatus.SELL_SHORT;
                pairInstance.positionEntry = candle.open; 
                pairInstance.positionHigh = candle.open;
                pairInstance.positionLow = candle.open; 
                this.orders.push(getNewOrder(candle,pairInstance.symbol,'S'))
            }
        }
    }
}

const getNewOrder = (candle,symbol,bias) => {
    return {
        date: new Date(candle.openTime).toLocaleString(),
        pair: symbol,
        bias: bias,
        qty: 0,
        borrowed: 0,
        equity: 0,
        avgPrice: BigNumber(candle.open),
        close: null,
    }
}

const checkEntryLongConditions = (orders, pairInstance) => {
    return pairInstance.orderStatus !== orderStatus.BUY_LONG &&
    (orders.length == 0 || pairInstance.orderStatus == orderStatus.SELL_CLOSED);
}

const checkEntryShortConditions = (orders, pairInstance) => {
    return pairInstance.orderStatus !== orderStatus.SELL_SHORT &&
    (orders.length == 0 || pairInstance.orderStatus == orderStatus.BUY_CLOSED);
}

const printToConsole = (orders, quantity, pairInstance) => {
    let close = orders[orders.length - 1].close;
    let open = orders[orders.length - 1].avgPrice;
    let pl = close.minus(open).dividedBy(open).multipliedBy(100);
    if(orders[orders.length - 1].bias == 'S') pl = pl.multipliedBy(-1);
    quantity = quantity.plus(quantity.dividedBy(100).multipliedBy(pl));

    console.log(`${orders[orders.length - 1].date} : ${quantity}$ ${pl}% LAST-ATR: ${pairInstance.lastAtr()}`)
    console.log(`---`)

    return quantity;
}

const updateIndicators = async (pairInstance, config) => {
    let smaPromise = tulind.indicators.sma.indicator([pairInstance.candleCloses],[config.maPeriod])
    let smaSlowPromise= tulind.indicators.sma.indicator([pairInstance.candleCloses],[config.maPeriod*config.maMultiplier])
    let atrPromise = tulind.indicators.atr.indicator(
        [pairInstance.candleHighs,pairInstance.candleLows,pairInstance.candleCloses],
        [config.atrPeriod]
    );
    let results = await Promise.all([ smaPromise, smaSlowPromise, atrPromise]);

    pairInstance.sma = results[0][0];
    pairInstance.smaLong = results[1][0];
    pairInstance.atr = results[2][0];

    return pairInstance;
}

const getStrategy =  async(symbol) => {
    let strategyFactory = new StrategyFactory()
    let strategyType = await symbolStrategyController.getStrategyBySymbol(symbol)
    return strategyFactory.build(strategyType)
}

const isCorrectConfig = (config) => {
    return true;
}

module.exports = BacktestingingService;