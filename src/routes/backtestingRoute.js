const router = require('express').Router();
const backtestingController = require('../controllers/backtestingController')

router
.post('/start', backtestingController.start);

module.exports = router;