# Security

- Store secrets in Railway Variables or local `.env`.
- Do not commit `.env`.
- Protect Vapi webhook requests with `x-vapi-secret`.
- Protect admin and read endpoints with `x-api-key`.
- Use Helmet security headers and rate limiting.
- Log only operational metadata; mask phone numbers in app-created logs.
- Use synthetic demo data only.

This demo is not HIPAA-compliant and must not collect real PHI.
