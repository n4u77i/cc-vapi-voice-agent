const express = require("express");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
const {
  listIntakes,
  getIntakeById
} = require("../controllers/intakes.controller");

const router = express.Router();

/**
 * @openapi
 * /api/v1/intakes:
 *   get:
 *     summary: List patient intake records
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Recent patient intakes.
 */
router.get("/", apiKeyAuth, listIntakes);

/**
 * @openapi
 * /api/v1/intakes/{id}:
 *   get:
 *     summary: Get a patient intake record
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
 *         description: Intake record.
 *       404:
 *         description: Intake not found.
 */
router.get("/:id", apiKeyAuth, getIntakeById);

module.exports = router;
