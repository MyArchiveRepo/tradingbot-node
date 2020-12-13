const { candleTracking } = require('./../tracking');
const { StrategyFactory } = require('../strategies');
const { symbolStrategyController } = require('./../controllers');
const binance = require('../exchange/binance');
const PairWrapper = require('../classes/PairWrapper');
const orderStatus = require('./orderStatus');
const sleep = require('util').promisify(setTimeout)
const wait_time = 800;

class TradingService {

    leverage = 2;
    wsCandles = null;

    constructor() {
        this.Running = false;
    }

    start = async (symbol, period) => {

        this.Running = true;
        PairWrapper.add(await binance.initPair(symbol, period));
        console.log("service sarted with: " + symbol)
        this.wsCandles = binance.client.ws.candles(symbol, period, async candle => candleTracking(symbol, candle))
        await this.checkSignalLoop(symbol, true)
    }

    stop = async () => {
        this.wsCandles();
        this.Running = false
    }

    checkSignalLoop = async (symbol, processOrder) => {

        try {
            if(!this.Running) return;
            let pairInstance = PairWrapper.get(symbol)

            let strategyFactory = new StrategyFactory()
            let strategyType = await symbolStrategyController.getStrategyBySymbol(pairInstance.symbol)
            let strategy = strategyFactory.build(strategyType)
            let signal = await strategy.getSignal(pairInstance)
            
            if (signal && processOrder) {

                if (signal.isBuy) {
                    try {

                        if(pairInstance.orderStatus !== orderStatus.BUY_REPAY) {
                            let repayBuyOrder = await binance.repayAllBaseDebts(pairInstance);
                            if(repayBuyOrder) pairInstance.orderStatus = orderStatus.BUY_REPAY;
                        }

                        await sleep(wait_time)
                        if(pairInstance.orderStatus !== orderStatus.BUY_CLOSED) {
                            let buyOrder = await binance.mgBuyLong(pairInstance,this.leverage);
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
                            let repaySellOrder = await binance.repayAllQuoteDebts(pairInstance);
                            if(repaySellOrder) pairInstance.orderStatus = orderStatus.SELL_REPAY;
                        }
                        
                        await sleep(wait_time)
                        if(pairInstance.orderStatus !== orderStatus.SELL_CLOSED) {
                            let sellOrder = await binance.mgSellShort(pairInstance,this.leverage);
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

        await this.checkSignalLoop(symbol, true)
    }


}

module.exports = new TradingService()