require('dotenv').config()
const { TredingService } = require('./services')

const pair = 'ETHUSDT';
const period = '15m';

TredingService.start(pair,period);

