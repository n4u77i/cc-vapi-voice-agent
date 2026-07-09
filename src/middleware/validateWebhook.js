const { env } = require("../config/env");
const { logger } = require("../config/logger");
const { createHash } = require("crypto");

function validateVapiWebhook(req, res, next) {
  const secret = normalizeSecret(
    req.header("x-vapi-secret") ||
      req.header("x-vapi-server-secret") ||
      parseBearerToken(req.header("authorization"))
  );
  const expectedSecret = normalizeSecret(env.VAPI_WEBHOOK_SECRET);

  if (!secret || secret !== expectedSecret) {
    logger.warn(
      {
        hasXVapiSecret: Boolean(req.header("x-vapi-secret")),
        hasXVapiServerSecret: Boolean(req.header("x-vapi-server-secret")),
        hasAuthorization: Boolean(req.header("authorization")),
        receivedSecretLength: secret?.length || 0,
        expectedSecretLength: expectedSecret?.length || 0,
        receivedSecretHashPrefix: secret ? fingerprint(secret) : null,
        expectedSecretHashPrefix: expectedSecret
          ? fingerprint(expectedSecret)
          : null,
        receivedHeaderNames: Object.keys(req.headers)
      },
      "vapi_webhook_auth_failed"
    );

    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid Vapi webhook secret."
    });
  }

  return next();
}

function parseBearerToken(authorizationHeader) {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

function normalizeSecret(secret) {
  if (!secret) return null;

  const normalized = String(secret)
    .trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/^["'`<({[]+|["'`>)}\]]+$/g, "")
    .trim();

  const hexSecret = normalized.match(/[a-f0-9]{64}/i);

  return hexSecret ? hexSecret[0] : normalized;
}

function fingerprint(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

module.exports = { validateVapiWebhook, parseBearerToken, normalizeSecret };
