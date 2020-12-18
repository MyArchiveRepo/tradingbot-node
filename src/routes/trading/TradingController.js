const TradingService = require('../../services/TradingService');

module.exports = {
    start: async (req, res) => {
        if(!req.body.symbol || !req.body.period) {
            res.sendStatus(400);
            return;
        }
        try{
            await TradingService.start(req.body.symbol, req.body.period);
            res.sendStatus(200);
        }catch(err){
            res.status(500).send(err)
        }

    },

    stop: async (req, res) => {
        if(TradingService.Running) {
            await TradingService.stop();
            res.sendStatus(200)
        }
        else res.sendStatus(202)
    },

    getStatus: (req,res) => {
        if(TradingService.Running) {
            res.status(200).send("RUNNING");
        }
        else res.status(200).send("STOPPED");
    }
}
