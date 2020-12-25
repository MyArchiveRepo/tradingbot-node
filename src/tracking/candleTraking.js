const tulind = require('tulind');
const PairWrapper = require('../classes/PairWrapper');

module.exports = async (symbol, candle) => {  
    
    let pairInstance = PairWrapper.get(symbol);

    pairInstance.updateLastCandle(candle)
    if(candle.isFinal) {
        pairInstance.addCandle(candle)
    }

    try{
        let smaresults = await tulind.indicators.sma.indicator([pairInstance.candleCloses],[200])

        pairInstance.sma = smaresults[0]
    }
    catch(err) {
        console.error('SMA ERROR: ------ ');
        console.error(err);
    }

}