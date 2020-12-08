const { candleTracking } = require('./../tracking');
const { StrategyFactory } = require('../strategies');
const { symbolStrategyController } = require('./../controllers');
const binance = require('../exchange/binance');
const PairWrapper = require('../classes/PairWrapper');
const sleep = require('util').promisify(setTimeout)
const wait_time = 800;

class TradingService {

    leverage = 1;
    wsCandles = null;

    constructor() {
        this.Running = false;
    }

    start = async (symbol, period) => {

        PairWrapper.add(await binance.initPair(symbol, period));

        this.wsCandles = binance.client.ws.candles(symbol, period, async candle => candleTracking(symbol, candle))
        this.Running = true;
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
            
            await sleep(wait_time)
            if (signal && processOrder) {

                if (signal.isBuy) {
                    try {
                        await binance.repayAllBaseDebts(pairInstance);
                        sleep(wait_time)
                        await binance.mgBuyLong(pairInstance,this.leverage);
                    } catch (err) {
                        console.error(err)
                    }
                }
                else {
                    try {
                        await binance.repayAllQuoteDebts(pairInstance);
                        sleep(wait_time)
                         await binance.mgSellShort(pairInstance,this.leverage);
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