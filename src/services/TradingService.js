const { candleTracking } = require('./../tracking');
const StrategyFactory  = require('../strategies/SrategyFactory');
const { symbolStrategyController } = require('./../controllers');
const Exchange = require('../exchange/binance');
const PairWrapper = require('../classes/PairWrapper');
const orderStatus = require('./orderStatus');
const sleep = require('util').promisify(setTimeout)
const wait_time = 800;

class TradingService {

    leverage = 2;
    wsCandles = {};
    config = {};
    constructor(config) {
        this.binance = new Exchange();
        this.symbol = config.symbol;
        this.period = config.period;
        this.config = config;
        let Strategy = StrategyFactory.build(config.strategy)
        this.strategy = new Strategy(config);
    }

    async start(){
        this.Running = true;
        PairWrapper.add(await this.binance.initPair(this.config));
        console.log("service sarted with: " + this.symbol)
        this.wsCandles = this.binance.client.ws.candles(this.symbol, this.period, async candle => this.strategy.candleTracking(candle))
        this.checkSignalLoop(true)
    }

    stop = async () => {
        console.log("stopping...")
        this.Running = false;
        this.wsCandles();
    }

    checkSignalLoop = async (processOrder) => {

        try {
            if(!this.Running){
                console.log("Exit from check signal loop.")
                return;
            }
            let pairInstance = PairWrapper.get(this.symbol)


            try{
                let hitAtrStopLoss = pairInstance.checkHitAtrStopLoss();
                let hitStopLoss = pairInstance.checkHitStopLoss();
                let hitTakeProfit = pairInstance.checkHitAtrTakeProfit();
    
                if(hitAtrStopLoss || hitStopLoss || hitTakeProfit){

                    switch (true) {
                        case hitAtrStopLoss:
                            console.log("HIT TRAILING STOP LOSS")
                            break;
                        case hitStopLoss:
                            console.log("HIT STOP LOSS")
                            break;
                        case hitTakeProfit:
                            console.log("HIT TAKE PROFIT")
                            break;
                        default:
                            break;
                    }
                    
                    if(pairInstance.orderStatus == orderStatus.BUY_LONG){
                        let closeBuy = await this.binance.mgCloseBuyLong(pairInstance);
                        if(closeBuy) pairInstance.orderStatus = orderStatus.BUY_CLOSED;
                    }
    
                    if(pairInstance.orderStatus == orderStatus.SELL_SHORT){
                        let closeSell = await this.binance.mgCloseSellShort(pairInstance);
                        if(closeSell) pairInstance.orderStatus = orderStatus.SELL_CLOSED;
                    }
                }
            }
            catch(err) {
                console.error(err);
            }

            let signal = await this.strategy.getSignal(pairInstance)
            await sleep(wait_time)
            if (signal && processOrder) {

                if (signal.isBuy && checkEntryLongConditions(pairInstance)) {
                    try {

                        if(pairInstance.orderStatus == orderStatus.SELL_CLOSED){
                            let sellReloadOrder = await this.binance.sellShort(pairInstance)
                            if(sellReloadOrder) console.log("RELOAD ORDER",sellReloadOrder)
                        }

                        await sleep(wait_time) 
                        let buyOrder = await this.binance.mgBuyLong(pairInstance,this.leverage);
                        if(buyOrder){
                            pairInstance.orderStatus = orderStatus.BUY_LONG;
                            pairInstance.positionEntry = buyOrder.fills[0].price;
                            pairInstance.positionHigh = buyOrder.fills[0].price;
                            pairInstance.positionLow = buyOrder.fills[0].price;
                            console.log("ORDER",buyOrder)
                            console.log("ENTRY",pairInstance.positionEntry)
                        }

                    } catch (err) {
                        console.error(err)
                    }
                }

                if(!signal.isBuy && checkEntryShortConditions(pairInstance)) {
                    try {

                        if(pairInstance.orderStatus == orderStatus.BUY_CLOSED){
                            let buyReloadOrder = await this.binance.buyLong(pairInstance)
                            if(buyReloadOrder) console.log("RELOAD ORDER",buyOrder)
                        }
                        
                        await sleep(wait_time)
                        let sellOrder = await this.binance.mgSellShort(pairInstance,this.leverage);
                        if(sellOrder) {
                            pairInstance.orderStatus = orderStatus.SELL_SHORT;
                            pairInstance.positionEntry = buyOrder.fills[0].price;
                            pairInstance.positionHigh = buyOrder.fills[0].price;
                            pairInstance.positionLow = buyOrder.fills[0].price;
                            console.log("ORDER",sellOrder)
                            console.log("ENTRY",pairInstance.positionEntry)
                        }

                   } catch (err) {
                        console.error(err)
                    }
                }

            }
        } catch (err) {
            console.log(err);
        }

        await this.checkSignalLoop(true)
    }


}

const checkEntryLongConditions = (pairInstance) => {
    return pairInstance.orderStatus !== orderStatus.BUY_LONG &&
    (pairInstance.orderStatus == orderStatus.INITIAL || pairInstance.orderStatus == orderStatus.SELL_CLOSED);
}

const checkEntryShortConditions = (orders, pairInstance) => {
    return pairInstance.orderStatus !== orderStatus.SELL_SHORT &&
    (pairInstance.orderStatus == orderStatus.INITIAL || pairInstance.orderStatus == orderStatus.BUY_CLOSED);
}

module.exports = TradingService