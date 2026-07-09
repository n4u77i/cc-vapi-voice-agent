# Deployment

Production runs on Railway.

1. Create a Railway project.
2. Add a PostgreSQL service.
3. Add this GitHub repository as an app service.
4. Configure environment variables from `.env.example`.
5. Deploy.

The Railway start command is `npm run start`, which runs Prisma migrations and starts `src/server.js`.

Set the Vapi Server URL to:

```text
https://your-app.up.railway.app/api/v1/vapi/webhook
```
