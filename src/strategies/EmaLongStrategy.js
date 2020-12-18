class EmaLongStrategy {

    constructor() {}

    getSignal = async (pairInstance) => {
        if(!pairInstance.ema || !pairInstance.ema.length) return null;
        
        let totCandles = pairInstance.candleCloses.length;
        let candleStrategyPeriod = 2
        let buyIndicator = 0;
        let sellIndicator = 0;

        let ema = pairInstance.ema[(pairInstance.ema.length - candleStrategyPeriod)];
        let candleClose = pairInstance.candleCloses[(totCandles - candleStrategyPeriod)]

        if(candleClose > ema) buyIndicator++;
        if(candleClose < ema) sellIndicator++;

        for(let i=2; i<candleStrategyPeriod; i++) {
            
            let ema = pairInstance.ema[(pairInstance.ema.length - i)];
            let candleOpen = pairInstance.candleOpens[(totCandles - i)]
            let candleClose = pairInstance.candleCloses[(totCandles - i)]

            if (ema < candleClose && ema < candleOpen) buyIndicator++;
            if (ema > candleClose && ema > candleOpen) sellIndicator++;
        }

        if(candleStrategyPeriod - 1  === buyIndicator && pairInstance.lastEma() > pairInstance.lastEmaLong()) return { isBuy: true }
        if(candleStrategyPeriod - 1 === sellIndicator && pairInstance.lastEma() < pairInstance.lastEmaLong()) return { isBuy: false }

        return null
    }
}

module.exports = EmaLongStrategy