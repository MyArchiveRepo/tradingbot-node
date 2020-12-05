const Binance = require('binance-api-node').default;
const Pair = require('./../models/Pair');
const { candleTracking } = require('./../tracking');
const { StrategyFactory } = require('../strategies');
const { symbolStrategyController } = require('./../controllers');
const { default: BigNumber } = require('bignumber.js');


const sleep = require('util').promisify(setTimeout)

const wait_time = 800;

const client = new Binance({
    apiKey: process.env.API_KEY,
    apiSecret: process.env.API_SECRET
});

class TradingService {

    pairData = {};
    isRunning = false;

    constructor() {}


    start = async (pair, period) => {

        if (this.isRunning) throw new Error("Trading service is already running...")

        this.isRunning = true;

        //await this.initPair(pair, period);
        try{
            client.ws.candles(pair, period, async candle => candleTracking(this.pairData[pair], candle))
        }
        catch(err){
            console.log(err)
        }
        
        //await this.checkSignalLoop(this.pairData[pair], true)

    }

    checkSignalLoop = async (pairInstance, processOrder) => {

        var today = new Date();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        console.log(time)

        const account = await client.marginAccountInfo(); //to insert in lib index.d.ts
        pairInstance.baseAsset = await account.userAssets.find(x => x.asset == pairInstance.info.baseAsset);
        pairInstance.quoteAsset = await account.userAssets.find(x => x.asset == pairInstance.info.quoteAsset);
        try {

            let strategyFactory = new StrategyFactory()
            let strategyType = await symbolStrategyController.getStrategyBySymbol(pairInstance.symbol)
            let strategy = strategyFactory.build(strategyType)
            let signal = await strategy.getSignal(pairInstance)
            
            let openOrders = await client.marginOpenOrders({ symbol: pairInstance.symbol });
            
            if (signal && (!openOrders || !openOrders.length) && processOrder) {
                

                if (signal.isBuy) {
                    console.log('BUY !!!')
                    try {
                        let quantity = pairInstance.getValidQuantity(pairInstance.quoteAsset.free)
                        if(quantity){
                            const order = await client.marginOrder({
                                symbol: pairInstance.symbol,
                                side: 'BUY',
                                type: 'MARKET',
                                quoteOrderQty: pairInstance.quoteAsset.free,
                                sideEffectType: 'NO_SIDE_EFFECT'
                            });
                        }
                    } catch (err) {
                        console.error(err)
                    }
                }
                else {
                    try {
                        let quantity = pairInstance.getValidQuantity(pairInstance.baseAsset.free)
                        if(quantity){
                            const order = await client.marginOrder({
                                symbol: pairInstance.symbol,
                                side: 'SELL',
                                type: 'MARKET',
                                sideEffectType: 'NO_SIDE_EFFECT',
                                quantity: quantity,
                            });
                        }
                    } catch (err) {
                        console.error(err)
                    }
                }

            }
        } catch (err) {
            console.log(err);
        }

        await this.checkSignalLoop(pairInstance, true)
    }

    initPair = async (symbol, period) => {

        this.pairData[symbol] = new Pair(symbol);
        const candles = await client.candles({ symbol: symbol, interval: period });
        candles.forEach(candle => {
            this.pairData[symbol].addCandle(candle)
        });

        const exchangeInfo = await client.exchangeInfo();
        const symbolInfo = exchangeInfo.symbols.find(x => x.symbol == symbol);
        if(!symbolInfo) throw new Error('Invalid symbol')

        this.pairData[symbol].info = symbolInfo;

    }


}

module.exports = new TradingService()