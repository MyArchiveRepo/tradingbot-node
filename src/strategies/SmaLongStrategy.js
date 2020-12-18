class SmaStrategy {

    constructor() {}

    getSignal = async (pairInstance) => {
        if(!pairInstance.sma || !pairInstance.sma.length) return null;
        if(!pairInstance.smaLong || !pairInstance.smaLong.length) return null;

        let totCandles = pairInstance.candleCloses.length;
        let candleStrategyPeriod = 2
        let buyIndicator = 0;
        let sellIndicator = 0;

        let sma = pairInstance.sma[(pairInstance.sma.length - candleStrategyPeriod)];
        let candleClose = pairInstance.candleCloses[(totCandles - candleStrategyPeriod)]

        if(candleClose > sma) buyIndicator++;
        if(candleClose < sma) sellIndicator++;

        for(let i=2; i<candleStrategyPeriod; i++) {
            
            let sma = pairInstance.sma[(pairInstance.sma.length - i)];
            let candleOpen = pairInstance.candleOpens[(totCandles - i)]
            let candleClose = pairInstance.candleCloses[(totCandles - i)]

            if (sma < candleClose && sma < candleOpen) buyIndicator++;
            if (sma > candleClose && sma > candleOpen) sellIndicator++;
        }

        if(candleStrategyPeriod - 1  === buyIndicator && pairInstance.lastSma() > pairInstance.lastSmaLong()) return { isBuy: true }
        if(candleStrategyPeriod - 1 === sellIndicator && pairInstance.lastSma() < pairInstance.lastSmaLong()) return { isBuy: false }

        return null
    }
}

module.exports = SmaStrategy