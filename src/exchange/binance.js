const Binance = require('binance-api-node').default;
const Pair = require('../classes/Pair');


class Exchange {
    
    client = {};

    constructor() {
        this.client = Binance({
            apiKey: process.env.API_KEY,
            apiSecret: process.env.API_SECRET,           
        });
    }

    initPair = async (symbol, period) => {

        let pairInstance = new Pair(symbol);
        const candles = await this.client.candles({symbol: symbol, interval: period});
        candles.forEach(candle => {
            pairInstance.addCandle(candle)
        });
    
        const exchangeInfo = await this.client.exchangeInfo();
        const symbolInfo = exchangeInfo.symbols.find(x => x.symbol == symbol);
        if (!symbolInfo) throw new Error('Invalid symbol')
    
        pairInstance.info = symbolInfo;
    
        return pairInstance;
    }

    repayAllBaseDebts = async (pairInstance) => {

        let account = await this.client.marginAccountInfo();
        let baseAsset = account.userAssets.find(x => x.asset == pairInstance.info.baseAsset);
        let debts = pairInstance.getDebts(baseAsset);
        let quantity = pairInstance.getValidQuantity(debts);
        
        if (quantity) {
            console.log('REPAY - ' + quantity);
            return await client.marginOrder({
                symbol: pairInstance.symbol,
                side: 'BUY',
                type: 'MARKET',
                quantity: quantity,
                sideEffectType: 'AUTO_REPAY'
            });
        }
    
        return null;
    }

    repayAllQuoteDebts = async (pairInstance) => {

        let account = await client.marginAccountInfo();
        let quoteAsset = await account.userAssets.find(x => x.asset == pairInstance.info.quoteAsset);
        let quoteDebts = pairInstance.getDebts(quoteAsset);
        let quantity = pairInstance.getValidQuantity(quoteDebts);
    
        if (quantity) {
            console.log('REPAY - ' + quantity);
            return await client.marginOrder({
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

        let account = await client.marginAccountInfo();
        let quoteAsset = await account.userAssets.find(x => x.asset == pairInstance.info.quoteAsset);
        let maxQuote = pairInstance.getValidLeverageQuantity(quoteAsset.free, leverage)
        let minNotional = pairInstance.checkMinNotional(maxQuote);
        if (maxQuote && minNotional) {
            console.log('BUY !!!')
            return await client.marginOrder({
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
        let account = await client.marginAccountInfo(); 
        let baseAsset = await account.userAssets.find(x => x.asset == pairInstance.info.baseAsset);
        let quantity = pairInstance.getValidLeverageQuantity(baseAsset.free, leverage)
        if (quantity) {
            console.log('SELL !!!')
            return await client.marginOrder({
                symbol: pairInstance.symbol,
                side: 'SELL',
                type: 'MARKET',
                sideEffectType: 'MARGIN_BUY',
                quantity: quantity,
            });
        }
    
        return null;
    }
}

module.exports = Exchange;