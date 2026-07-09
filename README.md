# CareCloud Voice AI Agent

Operational backend for a demo healthcare voice intake assistant. Vapi handles the phone call and voice assistant; this Express API receives Vapi webhooks, stores call/intake data with Prisma, and exposes health, readiness, metrics, documentation, and admin endpoints.

This is a hiring-challenge demo. Use synthetic data only. It is not a HIPAA-compliant production deployment.

## Architecture

```text
Caller
  -> Vapi Phone Number
  -> Vapi Assistant
  -> Railway HTTPS Express API
  -> Prisma
  -> Railway PostgreSQL
```

Local development uses PostgreSQL from `docker-compose.yml`; the Node app runs directly with `npm run dev`.

## Tech Stack

- Voice AI: Vapi
- API: Node.js, Express
- ORM: Prisma
- Database: Railway PostgreSQL in production, local PostgreSQL container for development
- Deployment: Railway GitHub auto-deploy
- Docs: Swagger UI at `/docs`
- Logs: Pino JSON logs
- Metrics: `prom-client` at `/metrics`
- Security: Helmet, rate limiting, API key admin auth, Vapi webhook secret

## Environment Variables

Copy `.env.example` to `.env` and fill values locally.

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://carecloud_user:carecloud_password@localhost:5432/carecloud_voice_agent?schema=public
VAPI_WEBHOOK_SECRET=your-local-vapi-secret
ADMIN_API_KEY=your-local-admin-key
CORS_ORIGIN=*
LOG_LEVEL=info
SERVICE_NAME=carecloud-voice-agent
SERVICE_VERSION=1.0.0
```

Railway variables:

```env
NODE_ENV=production
DATABASE_URL=<provided by Railway PostgreSQL>
VAPI_WEBHOOK_SECRET=<same value configured in Vapi>
ADMIN_API_KEY=<strong random key>
CORS_ORIGIN=*
LOG_LEVEL=info
SERVICE_NAME=carecloud-voice-agent
SERVICE_VERSION=1.0.0
```

## Local Development

```bash
docker compose up -d
npm install
npx prisma migrate dev --name init
npm run dev
```

Smoke checks:

```bash
curl http://localhost:3000/healthz
curl http://localhost:3000/readyz
curl http://localhost:3000/metrics
```

## Railway Deployment

1. Push the repository to GitHub.
2. Create a Railway project.
3. Add a PostgreSQL service.
4. Add an app service from the GitHub repository.
5. Add the environment variables listed above.
6. Deploy. Railway runs `npm run start`, which applies Prisma migrations and starts the server.

After deploy, configure Vapi's Server URL:

```text
https://your-app.up.railway.app/api/v1/vapi/webhook
```

Add this Vapi custom header:

```text
x-vapi-secret: <VAPI_WEBHOOK_SECRET>
```

## API Endpoints

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/healthz` | Public | Process health |
| GET | `/readyz` | Public | Database readiness |
| GET | `/metrics` | Public | Prometheus-style metrics |
| GET | `/docs` | Public | Swagger UI |
| POST | `/api/v1/vapi/webhook` | `x-vapi-secret` | Vapi events and tool calls |
| GET | `/api/v1/calls` | `x-api-key` | List recent calls |
| GET | `/api/v1/calls/:id` | `x-api-key` | Get one call |
| GET | `/api/v1/intakes` | `x-api-key` | List intakes |
| GET | `/api/v1/intakes/:id` | `x-api-key` | Get one intake |
| GET | `/api/v1/admin/status` | `x-api-key` | Operational status |
| POST | `/api/v1/admin/backup` | `x-api-key` | Backup guidance |

Detailed request/response documentation is in [docs/API.md](docs/API.md). Function-level documentation is in [docs/FUNCTIONS.md](docs/FUNCTIONS.md).

## Vapi Tool

Create a custom Vapi tool named `create_patient_intake`:

```json
{
  "name": "create_patient_intake",
  "description": "Save basic patient callback information collected during the call.",
  "parameters": {
    "type": "object",
    "properties": {
      "fullName": { "type": "string" },
      "dateOfBirth": { "type": "string" },
      "phone": { "type": "string" },
      "reason": {
        "type": "string",
        "enum": ["APPOINTMENT", "BILLING", "PRESCRIPTION", "GENERAL", "OTHER"]
      },
      "reasonDescription": { "type": "string" },
      "preferredCallbackTime": { "type": "string" },
      "consent": { "type": "boolean" }
    },
    "required": ["fullName", "reason", "consent"]
  }
}
```

Assistant prompt:

```text
You are CareCloud's AI intake assistant. Greet callers, explain that this is a demo callback intake assistant, and collect basic callback information.

Do not provide medical advice, diagnosis, prescriptions, or treatment recommendations. If the caller describes an emergency, tell them to call emergency services immediately. Ask callers not to share sensitive medical details.

Collect full name, date of birth, callback phone number, reason for call, preferred callback time, and consent to save the information. Then call create_patient_intake and confirm the request was recorded.
```

## Operations

- Monitoring: use `/healthz` for uptime and `/readyz` for DB readiness.
- Observability: Railway captures Pino JSON logs; `/metrics` exposes counters and latency histograms.
- Backups: use Railway PostgreSQL backups for production-style recovery. `npm run backup` demonstrates manual `pg_dump` export when `pg_dump` is installed.
- Security: secrets live in Railway Variables or local `.env`; `.env` is ignored by git.
- Reliability: Railway restart policy is configured in `railway.json`; the app handles graceful shutdown and Prisma disconnect.

## Tests

```bash
npm test
```

CI runs install, Prisma generation, migrations, and tests on GitHub Actions.

## Known Limitations

- Demo only; not HIPAA-compliant.
- No real patient data should be collected.
- No external alerting dashboard is included by default.
- Production hardening would add stricter network controls, formal incident response, managed backup verification, and a signed webhook scheme if supported by the voice platform.
