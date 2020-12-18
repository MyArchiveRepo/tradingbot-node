const strategies = require('./strategies')
const SmaStrategy = require('./SmaStrategy')
const EmaStrategy = require('./EmaStrategy')
const EmaLongStrategy = require('./EmaLongStrategy')
const SmaLongStrategy = require('./SmaLongStrategy')
module.exports = class StrategyFactory {

    build = (strategyType) => {

        if(!strategies[strategyType]) throw new Error("Strategy is not defined")
    
        switch(strategyType){
            case strategies.SMA:
            return new SmaStrategy()
            case strategies.EMA:
            return new EmaStrategy()
            case strategies.SMA_LONG:
            return new SmaLongStrategy()
            case strategies.EMA_LONG:
            return new EmaLongStrategy()
            default:
            return null;
        }

    }
}