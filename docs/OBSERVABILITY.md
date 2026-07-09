# Observability

- `/healthz` confirms the process is alive.
- `/readyz` checks PostgreSQL connectivity.
- `/metrics` exposes Prometheus-style metrics.
- Pino emits structured JSON logs for Railway log collection.
- `/api/v1/admin/status` gives authenticated operational counts and uptime.
