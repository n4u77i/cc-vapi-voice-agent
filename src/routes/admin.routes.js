const express = require("express");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
const {
  adminStatus,
  backupInstructions
} = require("../controllers/admin.controller");

const router = express.Router();

/**
 * @openapi
 * /api/v1/admin/status:
 *   get:
 *     summary: Operational status for administrators
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: App, DB, uptime, and record counts.
 */
router.get("/status", apiKeyAuth, adminStatus);

/**
 * @openapi
 * /api/v1/admin/backup:
 *   post:
 *     summary: Return backup instructions for the Railway deployment
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       202:
 *         description: Backup workflow accepted or documented.
 */
router.post("/backup", apiKeyAuth, backupInstructions);

module.exports = router;
