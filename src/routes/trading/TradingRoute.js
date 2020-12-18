const router = require('express').Router();
const TradingController = require('./TradingController')

module.exports = (app) => {
    router.route('/start').post(TradingController.start);
}