const strategies = require('./strategies')
const DummySmaStrategy = require('./DummySmaStrategy')
const SmaStrategy = require('./SmaStrategy')
const EmaStrategy = require('./EmaStrategy')
module.exports = class StrategyFactory {

    build = (strategyType) => {

        if(!strategies[strategyType]) throw new Error("Strategy is not defined")
    
        switch(strategyType){
            case strategies.DUMMY_SMA:
            return new DummySmaStrategy()
            case strategies.EMA:
            return new EmaStrategy()
            default:
            return new SmaStrategy()
        }

    }
}