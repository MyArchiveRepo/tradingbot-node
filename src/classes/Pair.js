const BigNumber = require('bignumber.js').default;

module.exports = class Pair{

    //symbol
    symbol = null;

    //asset
    assetBase = null;
    assetQuote = null;
    
    // candle data
    candleOpens = [];
    candleCloses = [];
    candleHighs = [];
    candleLows = [];

    // indicator data
    sma = null;
    macd = null;
    macdSignal = null;
    macdHistogram = null;

    lastSma = () => this.sma ? this.sma[this.sma.length -1] : null
    lastMacd = () => this.macd ? this.macd[this.macd.length -1] : null
    lastMacdSignal  = () => this.macdSignal ? this.macdSignal[this.macdSignal.length -1] : null
    lastMacdHistogram  = () => this.macdHistogram ? this.macdHistogram[this.macdHistogram.length -1] : null

    constructor(symbol){
        this.symbol = symbol;
    }
    
    addCandle(candle){
        this.candleOpens.push(candle.close)
        this.candleCloses.push(candle.close)
        this.candleHighs.push(candle.high)
        this.candleLows.push(candle.low)
    }

    updateLastCandle(candle){
        const index = this.candleOpens.length -1
        this.candleOpens[index] = Number(candle.open)
        this.candleCloses[index] = Number(candle.close)
        this.candleHighs[index] = Number(candle.high)
        this.candleLows[index] = Number(candle.low)
    }

    checkMinNotional(asset) {
        const filter = this.info.filters.find(x=>x.filterType == 'MIN_NOTIONAL');
        let minNotional = new BigNumber(filter.minNotional);
        return BigNumber(asset).isGreaterThan(minNotional);
    }

    getValidQuantity(qty){
        const filter = this.info.filters.find(x=>x.filterType == 'LOT_SIZE');
        let roundedQty = this.roundStep(qty, filter.stepSize);
        if( BigNumber(roundedQty).gte(filter.minQty) && BigNumber(roundedQty).lte(filter.maxQty) ) {
            return roundedQty;
        }
        return null;
    }

    getValidLeverageQuantity(qty, leverage){   
        let totLeverage = BigNumber(qty).multipliedBy(leverage).multipliedBy(0.95);
        return this.getValidQuantity(totLeverage.toString());
    }

    getDebts(asset) {
        let borrowed = asset.borrowed;
        let interest = asset.interest;
        let secureMargin = BigNumber(borrowed).multipliedBy(0.05);
        return BigNumber.sum(borrowed,interest,secureMargin).toString();
    }

    roundStep(qty, stepSize){
        if(BigNumber(qty).isInteger()) return qty;
        const desiredDecimals = BigNumber.max(stepSize.indexOf('1') - 1, 0);
        const decimalIndex = qty.indexOf('.');
        return qty.slice(0, BigNumber.sum(decimalIndex,desiredDecimals,1));
    }
}