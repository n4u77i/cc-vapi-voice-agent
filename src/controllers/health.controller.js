const { prisma } = require("../db/prisma");
const { register } = require("../metrics/metrics");
const { env } = require("../config/env");

async function healthCheck(req, res) {
  res.json({
    status: "ok",
    service: env.SERVICE_NAME,
    version: env.SERVICE_VERSION,
    timestamp: new Date().toISOString()
  });
}

async function readinessCheck(req, res, next) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}

async function metrics(req, res) {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
}

module.exports = {
  healthCheck,
  readinessCheck,
  metrics
};
