require("dotenv").config();

function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 3000),
  DATABASE_URL: required("DATABASE_URL"),
  VAPI_WEBHOOK_SECRET: required("VAPI_WEBHOOK_SECRET"),
  ADMIN_API_KEY: required("ADMIN_API_KEY"),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  SERVICE_NAME: process.env.SERVICE_NAME || "carecloud-voice-agent",
  SERVICE_VERSION: process.env.SERVICE_VERSION || "1.0.0"
};

module.exports = { env };
