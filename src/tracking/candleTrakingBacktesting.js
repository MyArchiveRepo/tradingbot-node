const tulind = require('tulind');
const PairWrapper = require('../classes/PairWrapper');

module.exports = async (symbol, candle) => {  
    
    let pairInstance = PairWrapper.get(symbol);
    pairInstance.addCandle(candle)

    try{
        let smaresults = await tulind.indicators.sma.indicator([pairInstance.candleCloses],[20])
        let smaSlowresults = await tulind.indicators.smaSlow.indicator([pairInstance.candleCloses],[50])

        pairInstance.sma = smaresults[0]
        pairInstance.smaSlow = smaSlowresults[0]

    }
    catch(err) {
        console.error('SMA ERROR: ------ ');
        console.error(err);
    }

}