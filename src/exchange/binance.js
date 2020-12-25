const Binance = require('binance-api-node').default;
const Pair = require('../classes/Pair');
const BigNumber = require('bignumber.js').default;

class Exchange {
    
    client = {};

    constructor() {
        this.client = Binance({
            apiKey: process.env.API_KEY,
            apiSecret: process.env.API_SECRET,           
        });
    }

    initPair = async (config) => {

        let pairInstance = new Pair(config);
        const candles = await this.client.candles({symbol: config.symbol, interval: config.period});
        candles.forEach(candle => {
            pairInstance.addCandle(candle)
        });
        let account = await this.client.marginAccountInfo();
        const exchangeInfo = await this.client.exchangeInfo();
        const symbolInfo = exchangeInfo.symbols.find(x => x.symbol == config.symbol);
        if (!symbolInfo) throw new Error('Invalid symbol')
    
        pairInstance.info = symbolInfo;
    
        return pairInstance;
    }

    async mgCloseSellShort(){
        let account = await this.client.marginAccountInfo();
        let quoteAsset = account.userAssets.find(x => x.asset == pairInstance.info.quoteAsset);
        let quantity = pairInstance.getValidQuantity(quoteAsset.free);

        if (quantity) {
            console.log('REPAY - ' + quantity);
            return await this.client.marginOrder({
                symbol: pairInstance.symbol,
                side: 'BUY',
                type: 'MARKET',
                quoteOrderQty: quantity,
                sideEffectType: 'AUTO_REPAY'
            });
        }
    
        return null;  
    }

    async mgCloseBuyLong(){
        let account = await this.client.marginAccountInfo();
        let baseAsset = account.userAssets.find(x => x.asset == pairInstance.info.baseAsset);
        let quantity = pairInstance.getValidQuantity(baseAsset.free);
    
        if (quantity) {
            console.log('REPAY - ' + quantity);
            return await this.client.marginOrder({
                symbol: pairInstance.symbol,
                side: 'SELL',
                type: 'MARKET',
                quantity: quantity,
                sideEffectType: 'AUTO_REPAY'
            });
        }
    
        return null;   
    }

    repayAllBaseDebts = async (pairInstance) => {

        let account = await this.client.marginAccountInfo();
        let baseAsset = account.userAssets.find(x => x.asset == pairInstance.info.baseAsset);
        let debts = pairInstance.getDebts(baseAsset);
        let quantity = pairInstance.getValidQuantity(debts);
        
        if (quantity) {
            console.log('REPAY - ' + quantity);
            return await this.client.marginOrder({
                symbol: pairInstance.symbol,
                side: 'BUY',
                type: 'MARKET',
                quoteOrderQty: quantity,
                sideEffectType: 'AUTO_REPAY'
            });
        }
    
        return null;
    }

    repayAllQuoteDebts = async (pairInstance) => {

        let account = await this.client.marginAccountInfo();
        let quoteAsset = await account.userAssets.find(x => x.asset == pairInstance.info.quoteAsset);
        let quoteDebts = pairInstance.getDebts(quoteAsset);
        let quantity = pairInstance.getValidQuantity(quoteDebts);
    
        if (quantity) {
            console.log('REPAY - ' + quantity);
            return await this.client.marginOrder({
                symbol: pairInstance.symbol,
                side: 'SELL',
                type: 'MARKET',
                quoteOrderQty: quantity,
                sideEffectType: 'AUTO_REPAY'
            });
        }
    
        return null;
    }

    mgBuyLong = async (pairInstance,leverage) => {

        let account = await this.client.marginAccountInfo();
        let quoteAsset = await account.userAssets.find(x => x.asset == pairInstance.info.quoteAsset);
        let maxQuote = pairInstance.getValidLeverageQuantity(quoteAsset.free, leverage)
        let minNotional = pairInstance.checkMinNotional(maxQuote);
        if (maxQuote && minNotional) {
            console.log('BUY !!!')
            return await this.client.marginOrder({
                symbol: pairInstance.symbol,
                side: 'BUY',
                type: 'MARKET',
                quoteOrderQty: maxQuote,
                sideEffectType: 'MARGIN_BUY'
            });
        }
    
        return null;
    }

    mgSellShort = async (pairInstance,leverage) => {
        let account = await this.client.marginAccountInfo(); 
        let baseAsset = await account.userAssets.find(x => x.asset == pairInstance.info.baseAsset);
        let quantity = pairInstance.getValidLeverageQuantity(baseAsset.free, leverage)
        if (quantity) {
            console.log('SELL !!!')
            return await this.client.marginOrder({
                symbol: pairInstance.symbol,
                side: 'SELL',
                type: 'MARKET',
                sideEffectType: 'MARGIN_BUY',
                quantity: quantity,
            });
        }
    
        return null;
    }

    getHistory = async (symbol, period, startTime, endTime, candles) => {

        if(!candles) candles = [];
    
        let newcandles = await this.client.candles({
            symbol: symbol,
            interval: period,
            startTime: startTime,
            endTime: endTime,
            limit: 1000
        });
    
        let lastClose = newcandles[newcandles.length-1].closeTime
        candles = candles.concat(newcandles);
        if(endTime <= lastClose) return candles;
    
        return await this.getHistory(symbol, period, lastClose, endTime, candles);
    }
}

module.exports = Exchange;