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
    atr = null;
    macd = null;
    macdSignal = null;
    macdHistogram = null;

    positionEntry = null;

    lastSma = () => this.sma ? this.sma[this.sma.length -1] : null
    lastMacd = () => this.macd ? this.macd[this.macd.length -1] : null
    lastMacdSignal  = () => this.macdSignal ? this.macdSignal[this.macdSignal.length -1] : null
    lastMacdHistogram  = () => this.macdHistogram ? this.macdHistogram[this.macdHistogram.length -1] : null
    lastCandleHigh = () => this.candleHighs ? this.candleHighs[this.candleHighs.length -1] : null
    lastCandleLow = () => this.candleLows ? this.candleLows[this.candleLows.length -1] : null
    previousCandleHigh  = () => this.candleHighs ? this.candleHighs[this.candleHighs.length - 2] : null
    previousCandleLow  = () => this.candleLows ? this.candleLows[this.candleLows.length - 2] : null
    previousCandleOpen  = () => this.candleOpens ? this.candleOpens[this.candleOpens.length - 2] : null
    lastCandleClose = () => this.candleCloses ? this.candleCloses[this.candleCloses.length -1] : null
    lastAtr = () => this.atr ? this.atr[this.atr.length -1] : null

    get atrStopLoss() {
        switch (this.orderStatus) {
            case orderStatus.BUY_LONG: return this.getAtrStopLossBuy();
            case orderStatus.SELL_SHORT: return this.getAtrStopLossSell();
            default: return null;
        }
    }

    get atrTakeProfit() {
        switch (this.orderStatus) {
            case orderStatus.BUY_LONG: return this.getAtrTakeProfitBuy();
            case orderStatus.SELL_SHORT: return this.getAtrTakeProfitSell();
            default: return null;
        }
    }

    get stopLoss() {
        switch (this.orderStatus) {
            case orderStatus.BUY_LONG: return this.getStopLossBuy();
            case orderStatus.SELL_SHORT: return this.getStopLossSell();
            default: return null;
        }
    }
    
    constructor(symbol,atrMultiplier,takeProfit,stopLossPrct){
        this.symbol = symbol;
        this.orderStatus = null;
        this.stopLossPrct = stopLossPrct;
        this.takeProfitMult = takeProfit;
        this.atrMultiplier = atrMultiplier;
    }


    getAtrStopLossBuy(){
        if(this.orderStatus != orderStatus.BUY_LONG || !this.atr || this.atr.length == 0) return null;
        return this.previousCandleLow()*1 - this.lastAtr() * this.atrMultiplier;
    }

    getAtrStopLossSell(){
        if(this.orderStatus != orderStatus.SELL_SHORT || !this.atr || this.atr.length == 0) return null;
        return this.previousCandleHigh()*1 + this.lastAtr() * this.atrMultiplier;
    }

    getAtrTakeProfitBuy(){
        if(this.orderStatus != orderStatus.BUY_LONG || !this.atr || this.atr.length == 0) return null;
        return this.previousCandleOpen()*1 + this.lastAtr() * this.takeProfitMult;
    }

    getAtrTakeProfitSell(){
        if(this.orderStatus != orderStatus.SELL_SHORT || !this.atr || this.atr.length == 0) return null;
        return this.previousCandleOpen()*1 - this.lastAtr() * this.takeProfitMult;
    }

    getStopLossBuy(){
        if(this.orderStatus != orderStatus.BUY_LONG || !this.positionEntry ) return null;
        return this.positionEntry*1 - (this.positionEntry / 100 ) * this.stopLossPrct;
    }

    getStopLossSell(){
        if(this.orderStatus != orderStatus.SELL_SHORT || !this.positionEntry) return null;
        return this.positionEntry*1 + (this.positionEntry / 100 ) * this.stopLossPrct;
    }

    checkHitAtrStopLoss() {
        switch (this.orderStatus) {
            case orderStatus.BUY_LONG: return this.atrStopLoss > this.lastCandleClose();
            case orderStatus.SELL_SHORT: return this.atrStopLoss < this.lastCandleClose();
            default: return false;
        }
    }

    checkHitAtrStopLossTest() {
        switch (this.orderStatus) {
            case orderStatus.BUY_LONG: return this.atrStopLoss > this.lastCandleLow();
            case orderStatus.SELL_SHORT: return this.atrStopLoss < this.lastCandleHigh();
            default: return false;
        }
    }

    checkHitAtrTakeProfit() {
        switch (this.orderStatus) {
            case orderStatus.BUY_LONG: return this.atrTakeProfit < this.lastCandleClose();
            case orderStatus.SELL_SHORT: return this.atrTakeProfit > this.lastCandleClose();
            default: return false;
        }
    }

    checkHitAtrTakeProfitTest() {
        switch (this.orderStatus) {
            case orderStatus.BUY_LONG: return this.atrTakeProfit < this.lastCandleHigh();
            case orderStatus.SELL_SHORT: return this.atrTakeProfit > this.lastCandleLow();
            default: return false;
        }
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
            case orderStatus.BUY_LONG: return this.stopLoss > this.lastCandleLow()
            case orderStatus.SELL_SHORT: return this.stopLoss < this.lastCandleHigh()
            default: return false;
        }
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
