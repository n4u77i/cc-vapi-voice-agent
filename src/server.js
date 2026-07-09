const { app } = require("./app");
const { env } = require("./config/env");
const { logger } = require("./config/logger");
const { prisma } = require("./db/prisma");

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(
    {
      port: env.PORT,
      host: env.HOST,
      env: env.NODE_ENV,
      service: env.SERVICE_NAME,
      version: env.SERVICE_VERSION
    },
    "server_started"
  );
});

async function shutdown(signal) {
  logger.info({ signal }, "shutdown_started");

  server.close(async () => {
    await prisma.$disconnect();
    logger.info("shutdown_completed");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
