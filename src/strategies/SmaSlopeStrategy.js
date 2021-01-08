const Heroku = require('heroku-client');
const tulind = require('tulind');
const PairWrapper = require('../classes/PairWrapper');
const HerokuWrapper = require('../utils/heroku');

const heroku = new HerokuWrapper({
    herokuApiToken: process.env.HEROKU_API_KEY,
    appName: process.env.APP_NAME
});

class SmaSlopeStrategy {

    constructor(config) {
        this.symbol = config.symbol;
        this.maPeriod = config.maPeriod;
        this.maMultiplier = config.maMultiplier;
        this.atrPeriod = config.atrPeriod;
    }

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
        pairInstance.updateHighAndLow(candle)
        if(candle.isFinal) {
            pairInstance.addCandle(candle)

            try{
                await heroku.updateHighAndLow(pairInstance)
            } catch(err){
                console.error("HEROKU",err);
            }
            
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