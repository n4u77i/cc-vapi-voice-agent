const os = require("os");
const { env } = require("../config/env");
const { prisma } = require("../db/prisma");

async function adminStatus(req, res, next) {
  try {
    const [callCount, intakeCount, eventCount] = await Promise.all([
      prisma.call.count(),
      prisma.patientIntake.count(),
      prisma.webhookEvent.count()
    ]);

    res.json({
      service: env.SERVICE_NAME,
      version: env.SERVICE_VERSION,
      environment: env.NODE_ENV,
      uptimeSeconds: process.uptime(),
      memory: process.memoryUsage(),
      host: os.hostname(),
      counts: {
        calls: callCount,
        intakes: intakeCount,
        webhookEvents: eventCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}

async function backupInstructions(req, res) {
  res.status(202).json({
    message: "Railway database backups should be used for managed recovery. The manual export path is documented in docs/BACKUP_RECOVERY.md.",
    command: "npm run backup"
  });
}

module.exports = {
  adminStatus,
  backupInstructions
};
