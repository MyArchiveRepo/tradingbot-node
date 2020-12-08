require('dotenv').config()
const { TredingService } = require('./services')

const pair = 'XRPUSDT';
const period = '1m';

TredingService.start(pair,period);

