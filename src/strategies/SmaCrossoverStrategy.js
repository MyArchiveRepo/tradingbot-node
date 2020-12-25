const tulind = require('tulind');
const PairWrapper = require('../classes/PairWrapper');

class SmaCrossoverStrategy {

    constructor(config) {
        this.symbol = config.symbol;
        this.maPeriod = config.maPeriod;
        this.maMultiplier = config.maMultiplier;
        this.atrPeriod = config.atrPeriod;
    }

    getSignal = async () => {
        let pairInstance = PairWrapper.get(this.symbol);
        
        if(!pairInstance.sma || !pairInstance.sma.length) return null;
        if(!pairInstance.smaLong || !pairInstance.smaLong.length) return null;

        if(pairInstance.sma[pairInstance.sma.length - 2] > pairInstance.smaLong[pairInstance.smaLong.length - 2] ) return { isBuy: true }
        if(pairInstance.sma[pairInstance.sma.length - 2] < pairInstance.smaLong[pairInstance.smaLong.length - 2] ) return { isBuy: false }

        return null
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

module.exports = SmaCrossoverStrategy