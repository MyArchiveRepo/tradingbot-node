const BigNumber = require('bignumber.js').default;
const orderStatus = require('./../services/orderStatus');
module.exports = class Pair{

    //symbol
    symbol = null;
    stopLossPrct = null;
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
    lastCandleHigh = () => this.candleHighs ? this.candleHighs[this.candleHighs.length -1] : null
    lastCandleLow = () => this.candleLows ? this.candleLows[this.candleLows.length -1] : null
    lastCandleClose = () => this.candleCloses ? this.candleCloses[this.candleCloses.length -1] : null

    get stopLossBuy() {

        if(this.orderStatus != orderStatus.BUY_LONG || !this.candleHighest) return null;
        return this.candleHighest*1 - (this.candleHighest / 100 ) * this.stopLossPrct;

    }

    get stopLossSell() {

        if(this.orderStatus != orderStatus.SELL_SHORT || !this.candleLowest) return null;
        return this.candleLowest*1 + (this.candleLowest / 100 ) * this.stopLossPrct;
        
    }

    get stopLoss() {
        switch (this.orderStatus) {
            case orderStatus.BUY_LONG: return this.stopLossBuy;
            case orderStatus.SELL_SHORT: return this.stopLossSell;
            default: return null;
        }
    }

    resetStopLoss(){
        this.candleHighest = this.lastCandleHigh()
        this.candleLowest = this.lastCandleLow()
    }
    
    constructor(symbol,stopLossPrct){
        this.symbol = symbol;
        this.orderStatus = null;
        this.stopLossPrct = stopLossPrct;
    }

    checkHitStopLoss() {
        switch (this.orderStatus) {
            case orderStatus.BUY_LONG: return this.stopLoss > this.lastCandleClose();
            case orderStatus.SELL_SHORT: return this.stopLoss < this.lastCandleClose();
            default: return false;
        }
    }

    checkHitStopLossTest() {
        switch (this.orderStatus) {
            case orderStatus.BUY_LONG: return this.stopLoss > this.lastCandleLow();
            case orderStatus.SELL_SHORT: return this.stopLoss < this.lastCandleHigh();
            default: return false;
        }
    }
    
    addCandle(candle){
        this.candleOpens.push(candle.close)
        this.candleCloses.push(candle.close)
        this.candleHighs.push(candle.high)
        this.candleLows.push(candle.low)
        
        this.updateLowest(candle.low)
        this.updateHighest(candle.high)
    }

    updateLowest(price){
        if(!this.candleLowest){
            this.candleLowest = price;
        }
        else{
            if(this.candleLowest < price){
                this.candleLowest = price;
            }
        }
    }

    updateHighest(price){

        if(!this.candleHighest){
            this.candleHighest = price;
        }
        else{
            if(this.candleHighest < price){
                this.candleHighest = price;
            }
        }
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