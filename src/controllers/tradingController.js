const TradingService = require('../services/TradingService');

module.exports = {
    start: async (req, res) => {
        if(!process.env.SYMBOL || !process.env.PERIOD) {
            res.sendStatus(400);
            return;
        }
        try{
            if(TradingService.Running) {
                res.send({
                    message: "Trading Service Already Stopped"
                });
                return;
            }
            await TradingService.start(process.env.SYMBOL, process.env.PERIOD);
            res.status(200).send({
                message: "Running"
            });
        }catch(err){
            res.status(500).send(err)
        }

    },

    stop: async (req, res) => {
        if(TradingService.Running) {
            await TradingService.stop();
            res.status(200).send({
                message: "Stopped"
            })
        }
        else res.status(202).send({
            message: "Trading Service Already Stopped"
        })
    },

    getStatus: (req,res) => {
        if(TradingService.Running) {
            res.status(200).send({
                status: "RUNNING"
            });
        }
        else {
            res.status(200).send({
                status: "STOPPED"
            });
        }
    }
}
