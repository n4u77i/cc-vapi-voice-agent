const { env } = require("../config/env");

function apiKeyAuth(req, res, next) {
  const apiKey = req.header("x-api-key");

  if (!apiKey || apiKey !== env.ADMIN_API_KEY) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Valid x-api-key header is required."
    });
  }

  return next();
}

module.exports = { apiKeyAuth };
