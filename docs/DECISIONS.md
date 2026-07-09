# Technical Decisions

## Vapi

Vapi is used instead of building telephony, STT, TTS, and real-time audio streaming from scratch. This keeps the challenge focused on operational infrastructure and backend reliability.

## Railway

Railway replaces AWS, Terraform, EC2, and reverse proxy setup for this time-bound challenge. It provides public HTTPS deployment, GitHub auto-deploy, logs, environment variables, and managed PostgreSQL.

## Prisma

Prisma provides schema management, migrations, and typed database access from Node.js without hand-writing business queries.

## Docker Compose

Docker Compose is used only for local PostgreSQL so development matches the production database engine without requiring a local database install.
