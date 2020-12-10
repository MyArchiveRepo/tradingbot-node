const binance = require('./exchange/binance');

const symbol = 'XRPUSDT';
const period = '15m';


const startDate = new Date(2020,11,1)
const endDate = new Date(2020,11,9)

const main = async () => {
    const candles = await binance.client.candles({
        symbol: symbol,
        interval: period,
        startTime: startDate.getTime(),
        endTime: endDate.getTime(),
        limit: 1000
    });
}

try{
    main();
} catch(err) {
    console.error(err);
}
