class DummySmaStrategy {

    constructor() {}

    getSignal = async (pairInstance) => {
        if(!pairInstance.sma || !pairInstance.sma.length) return null;
        
        let totCandles = pairInstance.candleCloses.length;
        let candleStrategyPeriod = 3
        let buyIndicator = 0;
        let sellIndicator = 0;

        for(let i=0; i<candleStrategyPeriod; i++) {
            let sma = pairInstance.sma[(totCandles - i) - 10];
            let candleOpen = pairInstance.candleOpens[(totCandles - i)  - 1]
            let candleClose = pairInstance.candleCloses[(totCandles - i)  - 1]
            if (candleOpen < candleClose && sma < candleOpen) buyIndicator++;
            if (candleOpen > candleClose && sma > candleOpen) sellIndicator++;
        }

        if(candleStrategyPeriod === buyIndicator) return { isBuy: true }
        if(candleStrategyPeriod === sellIndicator) return { isBuy: false }

        return null
    }
}

module.exports = DummySmaStrategy