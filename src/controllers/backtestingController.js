const BacktestingService = require('../services/BacktestingService');

const isCorrectStartBody = () =>{
    return true;
}

module.exports = {
    start: async (req, res) => {
        const backtesting= new BacktestingService(req.body)
        backtesting.start();
        res.status(200).send({});
    },
}
