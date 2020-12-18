const { candleTracking } = require('./../tracking');
const { StrategyFactory } = require('../strategies');
const { symbolStrategyController } = require('./../controllers');
const Exchange = require('../exchange/binance');
const PairWrapper = require('../classes/PairWrapper');
const orderStatus = require('./orderStatus');
const sleep = require('util').promisify(setTimeout)
const wait_time = 800;

class TradingService {

    leverage = 2;
    wsCandles = null;

    constructor(app) {
        this.binance = new Exchange();
        this.app = app;
        this.app.enable('RUNNING');
    }

    start = async (symbol, period) => {
        PairWrapper.add(await this.binance.initPair(symbol, period));
        console.log("service sarted with: " + symbol)
        this.wsCandles = this.binance.client.ws.candles(symbol, period, async candle => candleTracking(symbol, candle))
        this.checkSignalLoop(symbol, true)
    }

    stop = async () => {
        this.wsCandles();
    }

    checkSignalLoop = async (symbol, processOrder) => {

        try {
            if(!this.app.disable('RUNNING')) return;
            let pairInstance = PairWrapper.get(symbol)

            let strategyFactory = new StrategyFactory()
            let strategyType = await symbolStrategyController.getStrategyBySymbol(pairInstance.symbol)
            let strategy = strategyFactory.build(strategyType)
            let signal = await strategy.getSignal(pairInstance)
            
            if (signal && processOrder) {

                if (signal.isBuy) {
                    try {

                        if(pairInstance.orderStatus !== orderStatus.BUY_REPAY) {
                            let repayBuyOrder = await this.repayAllBaseDebts(pairInstance);
                            if(repayBuyOrder) pairInstance.orderStatus = orderStatus.BUY_REPAY;
                        }

                        await sleep(wait_time)
                        if(pairInstance.orderStatus !== orderStatus.BUY_CLOSED) {
                            let buyOrder = await this.binance.mgBuyLong(pairInstance,this.leverage);
                            if(buyOrder) pairInstance.orderStatus = orderStatus.BUY_LONG;
                            pairInstance.resetStopLoss();
                        }

                    } catch (err) {
                        console.error(err)
                    }
                }
                else {
                    try {

                        if(pairInstance.orderStatus !== orderStatus.SELL_REPAY) {
                            let repaySellOrder = await this.binance.repayAllQuoteDebts(pairInstance);
                            if(repaySellOrder) pairInstance.orderStatus = orderStatus.SELL_REPAY;
                        }
                        
                        await sleep(wait_time)
                        if(pairInstance.orderStatus !== orderStatus.SELL_CLOSED) {
                            let sellOrder = await this.binance.mgSellShort(pairInstance,this.leverage);
                            if(sellOrder) pairInstance.orderStatus = orderStatus.SELL_SHORT;
                            pairInstance.resetStopLoss();
                        }

                   } catch (err) {
                        console.error(err)
                    }
                }

            }
        } catch (err) {
            console.log(err);
        }

        await thischeckSignalLoop(symbol, true)
    }


}

module.exports = TradingService