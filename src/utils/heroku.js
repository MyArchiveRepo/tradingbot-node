
const Heroku = require('heroku-client')

class HerokuWrapper {

    constructor(configs){
        this.heroku = new Heroku({ token: configs.herokuApiToken});
        this.appName = configs.appName;
    }

    async updateOrderStatus(params) {
        let vars = {};
        vars['ORDER_STATUS'] = params.orderStatus;
        vars['ENTRY'] = params.positionEntry;

        return await this.heroku.patch(
            `/apps/${this.appName}/config-vars`,
            {
                body: vars
            }
        );
    }
}

module.exports = HerokuWrapper;