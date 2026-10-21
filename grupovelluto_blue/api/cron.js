/* Chamado pela Vercel Cron (ver vercel.json): dispara os avisos "vence hoje / amanhã" da API. */
const app = require('./app');
module.exports = (req, res) => { req.url = '/api/app?r=cron/daily'; return app(req, res); };
