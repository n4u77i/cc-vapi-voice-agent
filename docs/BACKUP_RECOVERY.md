# Backup And Recovery

Use Railway PostgreSQL backups for production-style recovery. For the demo, `npm run backup` runs `pg_dump` against `DATABASE_URL` and writes an export into `backups/`.

Demo targets:

- RPO: 24 hours
- RTO: 30 minutes

Restore process:

1. Choose a Railway backup or manual SQL export.
2. Restore into a new PostgreSQL database.
3. Point `DATABASE_URL` at the restored database.
4. Run `npx prisma migrate deploy`.
5. Check `/readyz` and `/api/v1/admin/status`.
