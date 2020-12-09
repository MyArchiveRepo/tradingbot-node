require('dotenv').config()
const { TredingService } = require('./services')

const pair = 'XRPUSDT';
const period = '15m';

TredingService.start(pair,period);

