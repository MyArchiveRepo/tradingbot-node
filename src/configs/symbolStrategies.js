const { strategies } = require('./../strategies')

module.exports = [
    {
        symbol: 'ETHUSDT',
        strategyName: strategies.SMA
    },{
        symbol: 'LTCUSDT',
        strategyName: strategies.EMA
    },{
        symbol: 'AGIBTC',
        strategyName: strategies.SMA
    },{
        symbol: 'BTCUSDT',
        strategyName: strategies.SMA
    },
    {
        symbol: 'XRPUSDT',
        strategyName: strategies.SMA
    },
];