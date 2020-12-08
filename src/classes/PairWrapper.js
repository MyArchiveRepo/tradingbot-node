class PairWrapper {
    
    constructor() {
        if(PairWrapper.instance == null) {
            this.pairData = {};
            PairWrapper.instance = this
        }
        return PairWrapper.instance
    }

    add(pair) {
        this.pairData[pair.symbol] = pair
        return this.pairData[pair.symbol]
    }

    get(symbol){
        return this.pairData[symbol];
    }

}

const pairWrapper= new PairWrapper()
Object.freeze(pairWrapper)

module.exports = pairWrapper;