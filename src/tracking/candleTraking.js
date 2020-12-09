const { candleController } = require('../controllers');
const tulind = require('tulind');
const PairWrapper = require('../classes/PairWrapper');

module.exports = async (symbol, candle) => {  
    
    let pairInstance = PairWrapper.get(symbol);

    pairInstance.updateLastCandle(candle)
    if(candle.isFinal) {
        pairInstance.addCandle(candle)
    }

    try{
        let smaresults = await tulind.indicators.sma.indicator([pairInstance.candleCloses],[20])
        //let macdResults = await tulind.indicators.macd.indicator([pairInstance.candleCloses], [12,26,9])

        pairInstance.sma = smaresults[0]
        //pairInstance.macd = macdResults[0]
        //pairInstance.macdSignal = macdResults[1]
        //pairInstance.macdHistogram = macdResults[2]
    }
    catch(err) {
        console.error('SMA ERROR: ------ ');
        console.error(err);
    }

}