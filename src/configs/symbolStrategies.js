const { strategies } = require('./../strategies')

module.exports = [
    {
        symbol: 'ETHUSDT',
        strategyName: strategies.SMA_CROSSOVER
    },{
        symbol: 'LTCUSDT',
        strategyName: strategies.SMA_CROSSOVER
    },{
        symbol: 'AGIBTC',
        strategyName: strategies.SMA_CROSSOVER
    },{
        symbol: 'BTCUSDT',
        strategyName: strategies.SMA_CROSSOVER
    },{
        symbol: 'ADAUSDT',
        strategyName: strategies.SMA_CROSSOVER
    },{
        symbol: 'XRPUSDT',
        strategyName: strategies.SMA_CROSSOVER
    },
];
