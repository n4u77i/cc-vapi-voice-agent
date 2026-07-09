# Function Reference

This document describes the main functions in `src/`, what each one is for, what it takes, and what it outputs. It documents the current implementation without changing source code.

## Entry Points

### `src/app.js`

#### `app`

Purpose: Creates and configures the Express application.

Inputs: Express receives HTTP requests through the mounted routes.

Behavior:

- Adds Helmet security headers.
- Enables CORS using `CORS_ORIGIN`.
- Parses JSON request bodies up to `1mb`.
- Adds request logging, metrics, and rate limiting.
- Mounts health, docs, Vapi, calls, intakes, and admin routes.
- Returns JSON `404` for unknown routes.
- Uses the global error handler.

Output: Exports `{ app }`, an Express app instance.

### `src/server.js`

#### `shutdown(signal)`

Purpose: Gracefully stops the HTTP server and disconnects Prisma on `SIGTERM` or `SIGINT`.

Inputs:

| Name | Type | Description |
| --- | --- | --- |
| `signal` | string | Process signal name such as `SIGTERM` or `SIGINT` |

Output: Closes the server, disconnects Prisma, logs shutdown completion, and exits the process.

## Configuration

### `src/config/env.js`

#### `required(name)`

Purpose: Reads a required environment variable and fails fast if it is missing.

Inputs:

| Name | Type | Description |
| --- | --- | --- |
| `name` | string | Environment variable name |

Output: Returns the environment variable value as a string.

Errors: Throws `Error` when the variable is missing or empty.

#### `env`

Purpose: Central runtime configuration object.

Inputs: `process.env`.

Output: Exports normalized config values for `NODE_ENV`, `PORT`, `DATABASE_URL`, `VAPI_WEBHOOK_SECRET`, `ADMIN_API_KEY`, `CORS_ORIGIN`, `LOG_LEVEL`, `SERVICE_NAME`, and `SERVICE_VERSION`.

### `src/config/logger.js`

#### `logger`

Purpose: Pino JSON logger configured with service, version, and environment metadata.

Inputs: `LOG_LEVEL`, `SERVICE_NAME`, `SERVICE_VERSION`, `NODE_ENV`.

Output: Exports `{ logger }`.

### `src/config/swagger.js`

#### `swaggerSpec`

Purpose: Generates the OpenAPI document used by Swagger UI at `/docs`.

Inputs: Route comments from `./src/routes/*.js`.

Output: Exports `{ swaggerSpec }`.

## Database

### `src/db/prisma.js`

#### `prisma`

Purpose: Shared Prisma Client instance used by controllers and services.

Inputs: `DATABASE_URL` through Prisma.

Output: Exports `{ prisma }`.

## Controllers

### `src/controllers/health.controller.js`

#### `healthCheck(req, res)`

Purpose: Handles `GET /healthz`.

Inputs: Express request and response objects.

Output: JSON service status with `status`, `service`, `version`, and `timestamp`.

#### `readinessCheck(req, res, next)`

Purpose: Handles `GET /readyz` by checking database connectivity.

Inputs: Express request, response, and `next`.

Output: JSON readiness status when `prisma.$queryRaw SELECT 1` succeeds.

Errors: Passes database errors to the global error handler.

#### `metrics(req, res)`

Purpose: Handles `GET /metrics`.

Inputs: Express request and response objects.

Output: Prometheus text from the shared metrics registry.

### `src/controllers/vapi.controller.js`

#### `handleVapiWebhook(req, res, next)`

Purpose: Handles `POST /api/v1/vapi/webhook`.

Inputs: Express request body containing a Vapi event, Vapi tool call, or plain intake request.

Output: JSON result returned by `processVapiMessage`.

Errors: Passes service errors to the global error handler.

### `src/controllers/calls.controller.js`

#### `listCalls(req, res, next)`

Purpose: Handles `GET /api/v1/calls`.

Inputs: Authenticated Express request.

Output: `{ data: Call[] }`, newest 25 calls with related intakes.

Errors: Passes Prisma errors to the global error handler.

#### `getCallById(req, res, next)`

Purpose: Handles `GET /api/v1/calls/:id`.

Inputs:

| Source | Name | Type | Description |
| --- | --- | --- | --- |
| path | `id` | string | Internal call UUID |

Output: `{ data: Call }` including intakes and latest webhook events.

Errors: Returns `404` if no call exists; passes database errors to the global error handler.

### `src/controllers/intakes.controller.js`

#### `listIntakes(req, res, next)`

Purpose: Handles `GET /api/v1/intakes`.

Inputs: Authenticated Express request.

Output: `{ data: PatientIntake[] }`, newest 25 intakes with related call data.

Errors: Passes Prisma errors to the global error handler.

#### `getIntakeById(req, res, next)`

Purpose: Handles `GET /api/v1/intakes/:id`.

Inputs:

| Source | Name | Type | Description |
| --- | --- | --- | --- |
| path | `id` | string | Internal intake UUID |

Output: `{ data: PatientIntake }` including related call data.

Errors: Returns `404` if no intake exists; passes database errors to the global error handler.

### `src/controllers/admin.controller.js`

#### `adminStatus(req, res, next)`

Purpose: Handles `GET /api/v1/admin/status`.

Inputs: Authenticated Express request.

Output: JSON with service metadata, uptime, memory, host, counts for calls/intakes/webhook events, and timestamp.

Errors: Passes Prisma errors to the global error handler.

#### `backupInstructions(req, res)`

Purpose: Handles `POST /api/v1/admin/backup`.

Inputs: Authenticated Express request.

Output: `202` JSON response explaining Railway backups and the manual `npm run backup` command.

## Services

### `src/services/vapi.service.js`

#### `processVapiMessage(payload)`

Purpose: Main Vapi ingestion function.

Inputs:

| Name | Type | Description |
| --- | --- | --- |
| `payload` | object | Vapi event, Vapi tool-call payload, or plain API Request intake body |

Behavior:

- Detects plain intake bodies and saves them.
- Extracts Vapi event type and call ID.
- Increments Vapi webhook metrics.
- Upserts call records when a Vapi call ID is present.
- Stores every webhook event payload.
- Handles `tool-calls` by invoking `create_patient_intake`.
- Saves transcript/summary for `end-of-call-report`.

Output:

- `{ received: true, eventType }` for normal events.
- `{ results: [...] }` for Vapi tool calls.
- `{ success, intakeId, message }` for plain intake requests.

#### `handlePlainIntakeRequest(payload)`

Purpose: Saves intake data from Vapi's API Request tool when it sends plain JSON rather than a Vapi `tool-calls` wrapper.

Inputs: Plain intake body, or an object with `arguments` or `parameters`.

Output: `{ success: true, intakeId, message }`.

Side effects: Creates a `PatientIntake`, stores a `WebhookEvent`, and logs receipt.

#### `isPlainIntakeRequest(payload)`

Purpose: Detects whether a request body looks like direct intake data.

Inputs: Any request payload.

Output: Boolean. Returns `true` when the body has name fields and is not already a Vapi event wrapper.

#### `upsertCallFromMessage(message, eventType)`

Purpose: Creates or updates a `Call` record from a Vapi message.

Inputs:

| Name | Type | Description |
| --- | --- | --- |
| `message` | object | Vapi message object |
| `eventType` | string | Vapi message type |

Output: Prisma `Call` record, or `null` when no Vapi call ID is present.

#### `handleToolCalls(message, call)`

Purpose: Handles Vapi `tool-calls` events.

Inputs:

| Name | Type | Description |
| --- | --- | --- |
| `message` | object | Vapi tool-call message |
| `call` | object or null | Related call record |

Output: `{ results: [...] }`, one result per tool call.

Behavior: Supports `create_patient_intake`; unknown tool names return a failed result.

#### `saveEndOfCallReport(message, call)`

Purpose: Saves final call transcript, summary, completed status, and end timestamp.

Inputs: Vapi end-of-call message and related call record.

Output: No response body; updates the `Call` row when a call exists.

#### `mapCallStatus(eventType)`

Purpose: Converts Vapi event types into local `CallStatus` enum values.

Inputs: Vapi event type string.

Output:

- `IN_PROGRESS` for `status-update`
- `COMPLETED` for `end-of-call-report`
- `UNKNOWN` otherwise

### `src/services/intake.service.js`

#### `createPatientIntakeFromToolCall({ callId, args })`

Purpose: Normalizes, validates, stores, logs, and counts a patient intake.

Inputs:

| Name | Type | Description |
| --- | --- | --- |
| `callId` | string or null | Internal call UUID if available |
| `args` | object or JSON string | Intake fields from Vapi |

Output: Created Prisma `PatientIntake` record.

Errors: Throws Zod validation errors for invalid/missing intake data.

#### `normalizeToolArgs(args = {})`

Purpose: Converts Vapi field variants into the internal intake shape.

Inputs: Object or JSON string with fields like `fullName`, `full_name`, `patientName`, `dob`, `reason`, and `preferred_callback_time`.

Output: Normalized object with `fullName`, `dateOfBirth`, `phone`, `reason`, `reasonDescription`, `preferredCallbackTime`, and `consent`.

#### `normalizeReason(reason)`

Purpose: Maps free-form reason text to the Prisma `IntakeReason` enum.

Inputs: String or empty value.

Output: One of `APPOINTMENT`, `BILLING`, `PRESCRIPTION`, `GENERAL`, or `OTHER`.

### `src/services/call.service.js`

#### `countCalls()`

Purpose: Counts call records.

Inputs: none.

Output: Number of `Call` rows.

### `src/services/backup.service.js`

#### `getBackupGuidance()`

Purpose: Returns backup guidance text for managed Railway backups and manual `pg_dump`.

Inputs: none.

Output:

```json
{
  "managed": "Use Railway PostgreSQL backups for production-style recovery.",
  "manual": "Run npm run backup from a machine with pg_dump available."
}
```

## Middleware

### `src/middleware/apiKeyAuth.js`

#### `apiKeyAuth(req, res, next)`

Purpose: Protects admin and read endpoints with `x-api-key`.

Inputs: Express request header `x-api-key`.

Output: Calls `next()` on success; otherwise returns `401`.

### `src/middleware/validateWebhook.js`

#### `validateVapiWebhook(req, res, next)`

Purpose: Protects Vapi webhook/API Request endpoint.

Inputs:

- `x-vapi-secret`
- `x-vapi-server-secret`
- `Authorization: Bearer <secret>`

Output: Calls `next()` on success; otherwise returns `401`.

Notes: Normalizes incoming secrets by trimming wrappers and extracting a 64-character hex token when present. Failed auth logs safe metadata only, not full secret values.

#### `parseBearerToken(authorizationHeader)`

Purpose: Extracts a bearer token from an Authorization header.

Inputs: Header string such as `Bearer abc123`.

Output: Token string, or `null` when missing/invalid.

#### `normalizeSecret(secret)`

Purpose: Makes Vapi-provided secrets comparable with the configured secret.

Inputs: Raw secret string.

Output: Trimmed secret string, or a 64-character hex token extracted from the input.

#### `fingerprint(value)`

Purpose: Creates a short SHA-256 prefix for safe debugging.

Inputs: Secret string.

Output: First 12 hex characters of the SHA-256 digest.

### `src/middleware/requestLogger.js`

#### `pinoRequestLogger`

Purpose: Logs every HTTP request using Pino.

Inputs: Express request/response lifecycle.

Output: Structured JSON request logs.

#### `metricsMiddleware(req, res, next)`

Purpose: Records HTTP request count and duration metrics.

Inputs: Express request and response.

Output: Calls `next()` and records metrics when the response finishes.

### `src/middleware/rateLimiter.js`

#### `rateLimiter`

Purpose: Limits request volume to reduce accidental or abusive traffic.

Inputs: Express request metadata.

Output: Allows requests under the limit; returns rate-limit responses when exceeded.

### `src/middleware/errorHandler.js`

#### `errorHandler(error, req, res, _next)`

Purpose: Central Express error handler.

Inputs: Error and Express request/response objects.

Output:

- `400` with Zod validation details for `ZodError`.
- `500` generic JSON error for all other unhandled errors.

## Utilities

### `src/utils/mask.js`

#### `maskPhone(phone)`

Purpose: Masks phone numbers before logging.

Inputs: Phone string or empty value.

Output: Masked phone string, `****` for very short values, or `null` for empty values.

### `src/utils/asyncHandler.js`

#### `asyncHandler(handler)`

Purpose: Wraps async Express handlers and forwards rejected promises to `next`.

Inputs: Express handler function.

Output: Express-compatible middleware function.

## Validation

### `src/validators/intake.validator.js`

#### `createIntakeSchema`

Purpose: Zod schema for validating patient intake data.

Inputs: Normalized intake object.

Output: Parsed object with validated fields and defaults.

Required fields:

- `fullName`

Defaults:

- `reason`: `OTHER`
- `consent`: `false`

## Metrics

### `src/metrics/metrics.js`

#### `register`

Purpose: Prometheus registry exposed by `/metrics`.

Output: Includes default Node.js metrics and custom app metrics.

#### `httpRequestsTotal`

Purpose: Counts HTTP requests by method, route, and status code.

Labels: `method`, `route`, `status_code`.

#### `httpRequestDurationSeconds`

Purpose: Tracks request duration histogram.

Labels: `method`, `route`, `status_code`.

#### `vapiWebhookEventsTotal`

Purpose: Counts Vapi webhook events by event type.

Labels: `event_type`.

#### `patientIntakesCreatedTotal`

Purpose: Counts patient intake records created by the service.
