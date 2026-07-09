const express = require("express");
const {
  healthCheck,
  readinessCheck,
  metrics
} = require("../controllers/health.controller");

const router = express.Router();

/**
 * @openapi
 * /healthz:
 *   get:
 *     summary: Basic health check
 *     responses:
 *       200:
 *         description: Service process is alive.
 */
router.get("/healthz", healthCheck);

/**
 * @openapi
 * /readyz:
 *   get:
 *     summary: Database readiness check
 *     responses:
 *       200:
 *         description: Service can connect to PostgreSQL.
 */
router.get("/readyz", readinessCheck);

/**
 * @openapi
 * /metrics:
 *   get:
 *     summary: Prometheus-style application metrics
 *     responses:
 *       200:
 *         description: Metrics in Prometheus text format.
 */
router.get("/metrics", metrics);

module.exports = router;
