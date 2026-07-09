# Architecture

```text
Caller -> Vapi Phone Number -> Vapi Assistant -> Railway Express API -> Prisma -> Railway PostgreSQL
```

Railway hosts the public HTTPS API and PostgreSQL database. Vapi sends webhook events and tool calls to `/api/v1/vapi/webhook`. Prisma stores calls, webhook events, and patient intake records.

Local development runs only PostgreSQL in Docker Compose. The Node.js app runs on the host with `npm run dev`.
