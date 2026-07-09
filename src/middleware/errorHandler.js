const { ZodError } = require("zod");
const { logger } = require("../config/logger");

function errorHandler(error, req, res, _next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Validation Error",
      details: error.errors
    });
  }

  logger.error(
    {
      err: error,
      path: req.path,
      method: req.method
    },
    "unhandled_error"
  );

  return res.status(500).json({
    error: "Internal Server Error",
    message: "An unexpected error occurred."
  });
}

module.exports = { errorHandler };
