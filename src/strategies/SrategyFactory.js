const strategies = require('./strategies')
class StrategyFactory {

    build = (strategyType) => {

        if(!strategies[strategyType]) throw new Error("Strategy is not defined")
    
        switch(strategyType){
            case strategies.SMA_CROSSOVER:
                return require('./SmaCrossoverStrategy')
            case strategies.SMA_SLOPE:
                return require('./SmaSlopeStrategy')
            default:
            return null;
        }

    }
}

module.exports = new StrategyFactory();