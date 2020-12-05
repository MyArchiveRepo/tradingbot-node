class DummySmaStrategy {

    constructor() {}

    getSignal = async (pairInstance) => {
        if(!pairInstance.sma || !pairInstance.sma.length) return null;
        
        let totCandles = pairInstance.candleCloses.length;
        let candleStrategyPeriod = 3
        let buyIndicator = 0;
        let sellIndicator = 0;

        let sma = pairInstance.sma[(pairInstance.sma.length - candleStrategyPeriod)];
        let candleClose = pairInstance.candleCloses[(totCandles - candleStrategyPeriod)]

        if(candleClose > sma) buyIndicator++;
        if(candleClose < sma) sellIndicator++;

        for(let i=1; i<candleStrategyPeriod; i++) {
            
            let sma = pairInstance.sma[(pairInstance.sma.length - i)];
            let candleOpen = pairInstance.candleOpens[(totCandles - i)]
            let candleClose = pairInstance.candleCloses[(totCandles - i)]

            if (sma < candleClose && sma < candleOpen) buyIndicator++;
            if (sma > candleClose && sma > candleOpen) sellIndicator++;
        }

        console.log("BUY INDICATOR: " + buyIndicator)
        console.log("SELL INDICATOR: " + sellIndicator)
        if(candleStrategyPeriod === buyIndicator) return { isBuy: true }
        if(candleStrategyPeriod === sellIndicator) return { isBuy: false }

        return null
    }
}

module.exports = DummySmaStrategy