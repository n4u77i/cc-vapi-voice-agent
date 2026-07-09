# API Reference

Swagger UI is available at `/docs`. All responses are JSON except `/metrics`, which returns Prometheus text format.

## Authentication

Vapi webhook/API Request calls must send one of these values matching `VAPI_WEBHOOK_SECRET`:

```text
x-vapi-secret: <secret>
x-vapi-server-secret: <secret>
Authorization: Bearer <secret>
```

Admin/read endpoints must send:

```text
x-api-key: <ADMIN_API_KEY>
```

## Endpoints

### `GET /healthz`

Purpose: Confirms the Express process is alive. It does not check database connectivity.

Request: no headers or body required.

Success response `200`:

```json
{
  "status": "ok",
  "service": "carecloud-voice-agent",
  "version": "1.0.0",
  "timestamp": "2026-07-08T23:20:44.091Z"
}
```

### `GET /readyz`

Purpose: Confirms the service can connect to PostgreSQL through Prisma.

Request: no headers or body required.

Success response `200`:

```json
{
  "status": "ready",
  "database": "connected",
  "timestamp": "2026-07-08T23:20:44.091Z"
}
```

Failure response `500`: returned by the global error handler if the database check fails.

### `GET /metrics`

Purpose: Exposes process, HTTP, Vapi webhook, and intake counters in Prometheus text format.

Request: no headers or body required.

Success response `200`:

```text
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
...
```

### `GET /docs`

Purpose: Serves Swagger UI generated from the route OpenAPI comments.

Request: no headers or body required.

Success response `200`: HTML Swagger UI page.

### `POST /api/v1/vapi/webhook`

Purpose: Receives Vapi call events, Vapi tool-call events, or the Vapi API Request tool body for `create_patient_intake`.

Auth: `x-vapi-secret`, `x-vapi-server-secret`, or `Authorization: Bearer <secret>`.

Supported request body for a Vapi status event:

```json
{
  "message": {
    "type": "status-update",
    "call": {
      "id": "vapi-call-id",
      "customer": {
        "number": "+15551234567"
      }
    }
  }
}
```

Success response `200`:

```json
{
  "received": true,
  "eventType": "status-update"
}
```

Supported request body for a Vapi tool-call event:

```json
{
  "message": {
    "type": "tool-calls",
    "call": {
      "id": "vapi-call-id"
    },
    "toolCallList": [
      {
        "id": "tool-call-id",
        "function": {
          "name": "create_patient_intake",
          "arguments": {
            "fullName": "Test Patient",
            "dateOfBirth": "1995-01-01",
            "phone": "555-123-4567",
            "reason": "APPOINTMENT",
            "preferredCallbackTime": "Morning",
            "consent": true
          }
        }
      }
    ]
  }
}
```

Success response `200`:

```json
{
  "results": [
    {
      "toolCallId": "tool-call-id",
      "result": {
        "success": true,
        "intakeId": "patient-intake-id",
        "message": "Patient intake has been recorded successfully."
      }
    }
  ]
}
```

Supported request body for Vapi API Request tool plain JSON:

```json
{
  "fullName": "Test Patient",
  "dateOfBirth": "1995-01-01",
  "phone": "555-123-4567",
  "reason": "APPOINTMENT",
  "reasonDescription": "Needs a callback",
  "preferredCallbackTime": "Morning",
  "consent": true
}
```

Success response `200`:

```json
{
  "success": true,
  "intakeId": "patient-intake-id",
  "message": "Patient intake has been recorded successfully."
}
```

Failure responses:

```json
{
  "error": "Unauthorized",
  "message": "Invalid Vapi webhook secret."
}
```

```json
{
  "error": "Validation Error",
  "details": []
}
```

### `GET /api/v1/calls`

Purpose: Lists the 25 most recent call records, newest first, with related intake records.

Auth: `x-api-key`.

Request: no body.

Success response `200`:

```json
{
  "data": [
    {
      "id": "call-id",
      "vapiCallId": "vapi-call-id",
      "callerNumber": "+15551234567",
      "status": "IN_PROGRESS",
      "startedAt": "2026-07-08T23:20:44.091Z",
      "endedAt": null,
      "transcript": null,
      "summary": null,
      "createdAt": "2026-07-08T23:20:44.091Z",
      "updatedAt": "2026-07-08T23:20:44.091Z",
      "intakes": []
    }
  ]
}
```

### `GET /api/v1/calls/:id`

Purpose: Gets one call by internal database ID, including related intakes and the 20 latest webhook events.

Auth: `x-api-key`.

Path parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Internal `Call.id` UUID |

Success response `200`:

```json
{
  "data": {
    "id": "call-id",
    "vapiCallId": "vapi-call-id",
    "callerNumber": "+15551234567",
    "status": "COMPLETED",
    "intakes": [],
    "events": []
  }
}
```

Not found response `404`:

```json
{
  "error": "Not Found",
  "message": "Call not found."
}
```

### `GET /api/v1/intakes`

Purpose: Lists the 25 most recent patient intake records, newest first, with related call data when available.

Auth: `x-api-key`.

Request: no body.

Success response `200`:

```json
{
  "data": [
    {
      "id": "intake-id",
      "callId": null,
      "fullName": "Test Patient",
      "dateOfBirth": "1995-01-01",
      "phone": "555-123-4567",
      "reason": "APPOINTMENT",
      "reasonDescription": null,
      "preferredCallbackTime": "Morning",
      "consent": true,
      "createdAt": "2026-07-08T23:20:44.091Z",
      "updatedAt": "2026-07-08T23:20:44.091Z",
      "call": null
    }
  ]
}
```

### `GET /api/v1/intakes/:id`

Purpose: Gets one patient intake by internal database ID, including related call data when available.

Auth: `x-api-key`.

Path parameters:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Internal `PatientIntake.id` UUID |

Success response `200`:

```json
{
  "data": {
    "id": "intake-id",
    "fullName": "Test Patient",
    "reason": "APPOINTMENT",
    "consent": true,
    "call": null
  }
}
```

Not found response `404`:

```json
{
  "error": "Not Found",
  "message": "Intake not found."
}
```

### `GET /api/v1/admin/status`

Purpose: Returns operational status for the service, including uptime, memory, host, environment, and database record counts.

Auth: `x-api-key`.

Request: no body.

Success response `200`:

```json
{
  "service": "carecloud-voice-agent",
  "version": "1.0.0",
  "environment": "production",
  "uptimeSeconds": 123.45,
  "memory": {},
  "host": "railway-hostname",
  "counts": {
    "calls": 1,
    "intakes": 1,
    "webhookEvents": 2
  },
  "timestamp": "2026-07-08T23:20:44.091Z"
}
```

### `POST /api/v1/admin/backup`

Purpose: Returns the backup workflow for this Railway deployment. It does not run `pg_dump` inside the HTTP request.

Auth: `x-api-key`.

Request: no body.

Success response `202`:

```json
{
  "message": "Railway database backups should be used for managed recovery. The manual export path is documented in docs/BACKUP_RECOVERY.md.",
  "command": "npm run backup"
}
```

## Common Error Responses

Unauthorized admin request:

```json
{
  "error": "Unauthorized",
  "message": "Valid x-api-key header is required."
}
```

Unhandled server error:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred."
}
```
