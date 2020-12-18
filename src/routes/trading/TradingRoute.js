const router = require('express').Router();
const TradingController = require('./TradingController')

router
.post('/start',TradingController.start)
.post('/stop', TradingController.stop)
.get('/status', TradingController.getStatus)

module.exports = router;