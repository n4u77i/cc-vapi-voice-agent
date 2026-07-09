const pino = require("pino");
const { env } = require("./env");

const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: env.SERVICE_NAME,
    version: env.SERVICE_VERSION,
    environment: env.NODE_ENV
  }
});

module.exports = { logger };
