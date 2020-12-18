const TredingService  = require('../../services/TradingService');

module.exports = {
    start: async(req, res) => {
        TredingService.start();
    }
}