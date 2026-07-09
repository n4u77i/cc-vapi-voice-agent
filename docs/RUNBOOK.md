# Runbook

## Health Check Fails

1. Check Railway service status.
2. Review recent deploy logs.
3. Confirm required variables are present.
4. Restart the Railway service if needed.

## Readiness Check Fails

1. Confirm Railway PostgreSQL is running.
2. Verify `DATABASE_URL`.
3. Run Prisma migrations.
4. Review application logs for Prisma errors.

## Vapi Webhook Fails

1. Confirm the Vapi Server URL ends with `/api/v1/vapi/webhook`.
2. Confirm Vapi sends `x-vapi-secret`.
3. Compare the header value with `VAPI_WEBHOOK_SECRET`.
4. Check Railway logs for validation or payload errors.
