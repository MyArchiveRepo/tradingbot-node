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
    
                if(hitAtrStopLoss || hitStopLoss){
    
                    if(pairInstance.orderStatus == orderStatus.BUY_LONG){
                        let closeBuy = await this.binance.mgCloseBuyLong();
                        if(closeBuy) pairInstance.orderStatus = orderStatus.BUY_CLOSED;
                    }
    
                    if(pairInstance.orderStatus == orderStatus.SELL_SHORT){
                        let closeSell = await this.binance.mgCloseSellShort();
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

                        await sleep(wait_time)
                        let buyOrder = await this.binance.mgBuyLong(pairInstance,this.leverage);
                        if(buyOrder){
                            pairInstance.orderStatus = orderStatus.BUY_LONG;
                            pairInstance.positionEntry = buyOrder.price;
                            console.log("ENTRY",pairInstance.positionEntry)
                        }

                    } catch (err) {
                        console.error(err)
                    }
                }

                if(!signal.isBuy && checkEntryShortConditions(pairInstance)) {
                    try {
                        
                        await sleep(wait_time)
                        let sellOrder = await this.binance.mgSellShort(pairInstance,this.leverage);
                        if(sellOrder) {
                            pairInstance.orderStatus = orderStatus.SELL_SHORT;
                            pairInstance.positionEntry = sellOrder.price;
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