const { candleController } = require('../controllers');
const tulind = require('tulind');

module.exports = async (pairInstance, candle) => {  

    pairInstance.updateLastCandle(candle)
    if(candle.isFinal) {
        pairInstance.addCandle(candle)
    }

    try{
        let smaresults = await tulind.indicators.sma.indicator([pairInstance.candleCloses],[10])
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