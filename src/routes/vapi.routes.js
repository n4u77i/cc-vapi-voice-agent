const express = require("express");
const { handleVapiWebhook } = require("../controllers/vapi.controller");
const { validateVapiWebhook } = require("../middleware/validateWebhook");

const router = express.Router();

/**
 * @openapi
 * /api/v1/vapi/webhook:
 *   post:
 *     summary: Receive Vapi webhook events and tool calls
 *     security:
 *       - VapiSecret: []
 *     responses:
 *       200:
 *         description: Event accepted.
 *       401:
 *         description: Missing or invalid Vapi webhook secret.
 */
router.post("/webhook", validateVapiWebhook, handleVapiWebhook);

module.exports = router;
