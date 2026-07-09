const { processVapiMessage } = require("../services/vapi.service");

async function handleVapiWebhook(req, res, next) {
  try {
    const result = await processVapiMessage(req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = { handleVapiWebhook };
