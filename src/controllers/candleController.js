const fs = require('fs');

addCandle = (pair, candle) => {
    let candleCsv = `${pair};${candle.openTime};${candle.closeTime};${candle.open};${candle.close}`
    try{    fs.appendFileSync('candles.csv',`${candleCsv}\n`);}
    catch(err){
        console.error();
    }

}

module.exports = {
    addCandle: addCandle
}