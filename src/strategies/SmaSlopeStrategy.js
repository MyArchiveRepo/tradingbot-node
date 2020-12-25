class SmaSlopeStrategy {

    constructor() {}

    getSignal = async () => {
        let pairInstance = PairWrapper.get(this.symbol);

        if(!pairInstance.sma  || pairInstance.sma.length < 2) return null;
        if(!pairInstance.smaLong || pairInstance.smaLong.length < 2) return null;

        if(this.isRising(pairInstance)) return { isBuy: true }
        if(this.isFalling(pairInstance)) return { isBuy: false }

        return null
    }

    isRising(pairInstance){
        return pairInstance.sma[pairInstance.sma.length - 2] > pairInstance.sma[pairInstance.sma.length - 3] &&
        pairInstance.smaLong[pairInstance.smaLong.length - 2] > pairInstance.smaLong[pairInstance.smaLong.length - 3];
    }

    isFalling(pairInstance){
        return pairInstance.sma[pairInstance.sma.length - 2] < pairInstance.sma[pairInstance.sma.length - 3] &&
        pairInstance.smaLong[pairInstance.smaLong.length - 2] < pairInstance.smaLong[pairInstance.smaLong.length - 3];
    }

    async candleTracking (candle) {  
    
        let pairInstance = PairWrapper.get(this.symbol);
    
        pairInstance.updateLastCandle(candle)
        if(candle.isFinal) {
            pairInstance.addCandle(candle)
        }
    
        let smaPromise = tulind.indicators.sma.indicator([pairInstance.candleCloses],[this.maPeriod])
        let smaSlowPromise= tulind.indicators.sma.indicator([pairInstance.candleCloses],[this.maPeriod*this.maMultiplier])
        let atrPromise = tulind.indicators.atr.indicator(
            [pairInstance.candleHighs,pairInstance.candleLows,pairInstance.candleCloses],
            [this.atrPeriod]
        );
        let results = await Promise.all([ smaPromise, smaSlowPromise, atrPromise]);
    
        pairInstance.sma = results[0][0];
        pairInstance.smaLong = results[1][0];
        pairInstance.atr = results[2][0];
    
        return pairInstance;
    
    }
}

module.exports = SmaSlopeStrategy