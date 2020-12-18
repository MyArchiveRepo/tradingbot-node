const { strategies } = require('./../strategies')

module.exports = [
    {
        symbol: 'ETHUSDT',
        strategyName: strategies.SMA_LONG
    },{
        symbol: 'LTCUSDT',
        strategyName: strategies.SMA_LONG
    },{
        symbol: 'AGIBTC',
        strategyName: strategies.SMA
    },{
        symbol: 'BTCUSDT',
        strategyName: strategies.SMA_LONG
    },{
        symbol: 'XRPUSDT',
        strategyName: strategies.SMA
    },
];
