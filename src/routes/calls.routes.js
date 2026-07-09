const express = require("express");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
const { listCalls, getCallById } = require("../controllers/calls.controller");

const router = express.Router();

/**
 * @openapi
 * /api/v1/calls:
 *   get:
 *     summary: List recent voice calls
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Recent call records.
 */
router.get("/", apiKeyAuth, listCalls);

/**
 * @openapi
 * /api/v1/calls/{id}:
 *   get:
 *     summary: Get a call with related intakes and webhook events
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Call record.
 *       404:
 *         description: Call not found.
 */
router.get("/:id", apiKeyAuth, getCallById);

module.exports = router;
