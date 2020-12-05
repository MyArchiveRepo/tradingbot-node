const { symbolStrategies } = require('./../configs')

getStrategyBySymbol= async (symbol) => {
    const symbolStrategy = symbolStrategies.find(element => element.symbol === symbol)
    return symbolStrategy.strategyName;
}

module.exports = {
    getStrategyBySymbol: getStrategyBySymbol
}