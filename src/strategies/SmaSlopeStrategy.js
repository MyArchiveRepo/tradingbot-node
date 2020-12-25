class SmaSlopeStrategy {

    constructor() {}

    getSignal = async (pairInstance) => {
        if(!pairInstance.sma  || pairInstance.sma.length < 2) return null;
        if(!pairInstance.smaLong || pairInstance.smaLong.length < 2) return null;

        if(this.isRising(pairInstance)) return { isBuy: true }
        if(this.isFalling(pairInstance)) return { isBuy: false }

        return null
    }

    isRising(pairInstance){
        return pairInstance.sma[pairInstance.sma.length - 2] > pairInstance.sma[pairInstance.sma.length - 3] &&
        pairInstance.smaLong[pairInstance.smaLong.length - 2] > pairInstance.smaLong[pairInstance.smaLong.length - 3];
    }

    isFalling(pairInstance){
        return pairInstance.sma[pairInstance.sma.length - 2] < pairInstance.sma[pairInstance.sma.length - 3] &&
        pairInstance.smaLong[pairInstance.smaLong.length - 2] < pairInstance.smaLong[pairInstance.smaLong.length - 3];
    }
}

module.exports = SmaSlopeStrategy