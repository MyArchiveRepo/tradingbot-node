const { candleController } = require('../controllers');
const tulind = require('tulind');
const PairWrapper = require('../classes/PairWrapper');

module.exports = async (symbol, candle) => {  
    
    let pairInstance = PairWrapper.get(symbol);
    pairInstance.addCandle(candle)

    try{
        let smaresults = await tulind.indicators.sma.indicator([pairInstance.candleCloses],[20])
        pairInstance.sma = smaresults[0]

    }
    catch(err) {
        console.error('SMA ERROR: ------ ');
        console.error(err);
    }

}