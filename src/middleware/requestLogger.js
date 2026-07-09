const pinoHttp = require("pino-http");
const { logger } = require("../config/logger");
const {
  httpRequestsTotal,
  httpRequestDurationSeconds
} = require("../metrics/metrics");

const pinoRequestLogger = pinoHttp({
  logger,
  customLogLevel(req, res, error) {
    if (res.statusCode >= 500 || error) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage() {
    return "request_completed";
  },
  customErrorMessage() {
    return "request_failed";
  }
});

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    const route = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });

    httpRequestDurationSeconds.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode
      },
      duration
    );
  });

  next();
}

module.exports = {
  requestLogger: [pinoRequestLogger, metricsMiddleware]
};
