I am given this task by a company in the process of hiring.

"""
Thank you for applying for the DevOps / Infrastructure Engineer role at CareCloud.

As the next step in our evaluation process, we would like to invite you to complete a time-bound technical challenge. The purpose of this assessment is to evaluate your ability to build and operate production-ready infrastructure around an AI-powered voice agent while demonstrating your technical expertise, operational thinking, and prioritization skills.

Technical Challenge

You will be asked to complete a 3-hour technical assessment consisting of two parts:

Part 1 – Build a Functional Voice AI Agent

Create and deploy a basic AI-powered healthcare voice agent that can answer phone calls, greet callers, collect basic patient information, and communicate with a backend service.

Part 2 – Build the Operational Infrastructure

Once the voice agent is functional, design and implement the operational infrastructure required to support it in a production environment. This includes making architectural decisions around deployment, monitoring, reliability, security, observability, backups, documentation, and operational readiness.

You are free to use any technologies you are comfortable with. Below are some suggested technologies (these are recommendations only):

Voice AI Platforms

Vapi
ElevenLabs Conversational AI
Retell AI
Bland.ai
LLMs

OpenAI (GPT-4o / GPT-4o-mini)
Anthropic Claude
Google Gemini
Backend

Python (FastAPI / Flask)
Node.js (Express / Fastify)
Go
Ruby on Rails
Infrastructure & Deployment

AWS or GCP
Docker / Docker Compose
Terraform / Pulumi / CDK
GitHub Actions
Railway
Render
Fly.io
Database

PostgreSQL
SQLite
MongoDB
Supabase
During the assessment, we will evaluate areas including:

Deployment and infrastructure design
Monitoring, logging, and observability
Backup and recovery strategy
Secrets management and security practices
Reliability and operational readiness
Documentation and deployment process
Technical decision-making and prioritization
Please ensure your final submission includes:

Source code repository (GitHub/GitLab)
Working phone number for testing the voice agent
Infrastructure and deployment code
Documentation (README)
Any monitoring dashboards or operational endpoints, if applicable
Important Note on Compensation

If the challenge is not fully completed within the allotted time, we may still consider your application and evaluate it based on the quality of your implementation, technical approach, and demonstrated skills. In such cases, the role scope and compensation may be adjusted accordingly.

Scheduling the Challenge

Please reply to this email with:

A suitable date and time to complete the 3-hour technical assessment
Confirmation that your development environment and required tools will be ready before the assessment begins
Once we receive your availability, we will schedule your assessment and share the challenge package along with any required credentials.

We look forward to seeing your solution and learning more about your approach to building reliable production infrastructure.
"""

Now I need you to give me options that what tools should I use to keep the project free and simple and an implementation plan.

I’ll map this around the 3-hour constraint: fastest path to a working phone demo first, then lightweight “production-readiness” around it without over-engineering. I’ll also verify free-tier/tool assumptions because pricing and trial limits change often.

The strongest “free + simple” path is not to build telephony/STT/TTS yourself. Use one voice platform for the phone layer, then spend your DevOps effort on backend, deployment, monitoring, security, and docs.

Thought for 1m 19s
Best option: Vapi + FastAPI + Supabase + Render

For a 3-hour hiring challenge, I would keep the voice layer managed and focus your real effort on infrastructure quality.

Recommended free/simple stack
Area	Tool	Why
Voice agent + phone number	Vapi	Fastest way to get a working inbound phone agent. Vapi provides free US phone numbers, and its pricing page mentions 60+ included call minutes plus usage-based billing after that.
LLM	GPT-4o-mini / small OpenAI model	Cheap and enough for a simple intake agent. GPT-4o-mini API pricing is listed at $0.15 / 1M input tokens and $0.60 / 1M output tokens.
Backend	Python FastAPI	Quick to build, automatic Swagger docs, clean for webhooks and operational endpoints.
Database	Supabase PostgreSQL free tier	Free Postgres with 500 MB database size, enough for demo call logs and patient-intake records.
Deployment	Render free web service	Very fast GitHub-based deployment. Render has free web services, but the free tier spins down after 15 minutes of inactivity, so document this as a demo limitation.
CI/CD	GitHub Actions	Free tier includes CI/CD minutes; public repos are free for Actions minutes.
Monitoring	UptimeRobot + /healthz endpoint	UptimeRobot offers free monitors and is enough to prove uptime monitoring for the challenge.
Infra code	Dockerfile + docker-compose.yml + render.yaml	Simpler than Terraform for 3 hours, but still shows deployment-as-code.

One important note: because this is healthcare-related, do not collect real patient/PHI data in the demo. Vapi’s HIPAA option is listed as a paid enterprise-style feature, so your README should clearly say: “Demo only. Use synthetic patient data. Not HIPAA-compliant production deployment.”

Architecture you should build
Caller
  ↓
Vapi Free Phone Number
  ↓
Vapi Voice Assistant
  ↓ tool call / webhook
FastAPI Backend on Render
  ↓
Supabase PostgreSQL

Operational layer:
GitHub Actions → test/build/deploy
UptimeRobot → /healthz
FastAPI → /metrics, /readyz, /docs
JSON logs → Render logs
Backup script → pg_dump
Voice agent behavior

Keep the actual voice agent very simple:

It should say:

“Hello, this is CareCloud’s AI intake assistant. I can collect basic information for a callback. Please do not share emergency information. If this is a medical emergency, please call emergency services.”

Then collect:

Field	Example
Full name	Ali Khan
Date of birth	1998-03-12
Phone number	+1...
Reason for call	Appointment request / billing / prescription / general
Preferred callback time	Morning / afternoon / evening
Consent	“Do you agree that this information can be saved for callback?”

Then call backend tool:

{
  "name": "create_patient_intake",
  "arguments": {
    "full_name": "Ali Khan",
    "dob": "1998-03-12",
    "phone": "+15551234567",
    "reason": "appointment request",
    "preferred_callback_time": "morning",
    "consent": true
  }
}

Vapi supports Server URLs/webhooks for status updates, transcripts, function/tool calls, and end-of-call reports. It also supports OpenAI-style tool/function calling to your server.

Backend endpoints to implement

Use FastAPI and create these endpoints:

GET  /healthz
GET  /readyz
GET  /metrics
POST /vapi/webhook
GET  /calls
GET  /intakes
POST /admin/backup-request

Minimum behavior:

Endpoint	Purpose
/healthz	Basic app health. Returns 200 OK.
/readyz	Checks database connectivity.
/metrics	Prometheus-style metrics: total calls, successful intakes, failed webhooks, latency.
/vapi/webhook	Receives Vapi events and tool calls.
/calls	View call logs for testing. Protect with simple API key.
/intakes	View collected intake records. Protect with simple API key.
Database tables

Use 3 simple tables:

calls (
  id uuid primary key,
  vapi_call_id text,
  caller_number text,
  status text,
  started_at timestamptz,
  ended_at timestamptz,
  transcript text,
  summary text,
  created_at timestamptz default now()
);

patient_intakes (
  id uuid primary key,
  call_id uuid references calls(id),
  full_name text,
  dob text,
  phone text,
  reason text,
  preferred_callback_time text,
  consent boolean,
  created_at timestamptz default now()
);

webhook_events (
  id uuid primary key,
  event_type text,
  call_id text,
  payload jsonb,
  created_at timestamptz default now()
);

For demo security, you can store fake data only. Also mask phone numbers in logs.

3-hour implementation plan
Before the assessment

Prepare these accounts/tools:

GitHub
Vapi
OpenAI API key
Render
Supabase
UptimeRobot
Docker
Python 3.11+

Also prepare a blank repo with:

app/
  main.py
  db.py
  models.py
  schemas.py
  settings.py
  logging_config.py
  metrics.py
migrations/
Dockerfile
docker-compose.yml
render.yaml
.github/workflows/ci.yml
README.md
.env.example

Do not write the full challenge solution before the assessment if they expect live work, but you can prepare your local environment and know the structure.

During the 3 hours
0:00–0:30 — Backend skeleton

Build FastAPI app:

/healthz
/readyz
/metrics
/vapi/webhook

Add:

.env loading
structured JSON logs
API key middleware for admin endpoints
database connection
0:30–1:10 — Database + webhook

Create Supabase tables.

Implement Vapi webhook handler:

status-update → save call status
transcript → save event
tool-calls → create patient intake
end-of-call-report → save summary/transcript
1:10–1:45 — Vapi assistant

Create Vapi assistant with:

inbound phone number
system prompt
create_patient_intake tool
server URL = Render backend URL or temporary ngrok URL
webhook bearer token

Vapi supports server authentication with custom credentials and bearer-token style setup.

1:45–2:15 — Deployment

Deploy backend to Render.

Add:

Dockerfile
render.yaml
environment variables in Render
DATABASE_URL
WEBHOOK_SECRET
ADMIN_API_KEY
OPENAI_API_KEY if needed

Render free services are useful for demo, but mention in README that free services can sleep and production should use an always-on paid instance.

2:15–2:35 — CI/CD

GitHub Actions:

Run tests
Run lint
Build Docker image

Keep it simple. Even if auto-deploy is handled by Render, the CI pipeline shows operational discipline.

2:35–2:50 — Monitoring + backup

Add UptimeRobot monitor for:

GET /healthz

Add backup command:

make backup

or:

scripts/backup.sh

It can run:

pg_dump "$DATABASE_URL" > backups/backup_$(date +%Y%m%d_%H%M%S).sql

In README, define:

RPO: 24 hours for demo
RTO: 30 minutes for demo
Production: managed backups + PITR + multi-region strategy
2:50–3:00 — README + final test

README should include:

Architecture diagram
Setup instructions
Environment variables
How to call/test the phone number
API endpoints
Monitoring link or screenshot
Backup/recovery strategy
Security notes
Known limitations
Production improvements
Alternative options
Option 1 — Best overall
Vapi + FastAPI + Supabase + Render + GitHub Actions

Use this. It is the best balance of speed, free/demo-friendly setup, and DevOps visibility.

Option 2 — If Vapi setup fails
Retell AI + FastAPI + Supabase + Render

Retell starts at $0 and is pay-as-you-go, so it can also work for a quick demo.

Option 3 — If you want better voice quality
ElevenLabs Conversational AI + FastAPI + Supabase + Render

Good voice quality, but I would not choose it first unless you already know the platform. ElevenLabs has startup/grant/free options, but the setup may take more time than Vapi.

Option 4 — Avoid for this assessment
Twilio + OpenAI Realtime + custom WebSocket backend

This is more impressive technically, but too risky for 3 hours. You would spend too much time debugging audio streams, telephony, latency, and WebSocket handling.

What will impress CareCloud most

Do not try to build a huge app. Build a small working system with strong operational thinking.

Your strongest submission should show:

Working phone number
Successful patient intake saved to database
Webhook security
Health/readiness endpoints
Metrics endpoint
Structured logs
CI pipeline
Dockerized deployment
Backup script
Clear README
Known limitations
Production upgrade path

The key message should be:

“I prioritized a working voice agent first, then added the minimum production infrastructure needed to operate, observe, secure, and recover it.”

I want to use NodeJS (Express) instead of FastAPI.
I want to also use Terraform code which creates an EC2 instance on AWS.and other required infrastructure.
I need to have docker file and docker-cmpose file for deployment.
I need to have documentation for each endpoint.
I need to have these as well since I will be evaluated based on these:
Deployment and infrastructure design
Monitoring, logging, and observability
Backup and recovery strategy
Secrets management and security practices
Reliability and operational readiness
Documentation and deployment process
Technical decision-making and prioritization

And also:
Infrastructure and deployment code
Documentation (README)
Any monitoring dashboards or operational endpoints, if applicable


Good direction. With Node + Terraform + EC2, I would make the assessment look DevOps-heavy while keeping the app small. The biggest practical risk is public HTTPS for the Vapi webhook, so I’ll include both the ideal path and a fast fallback.

Thought for 58s

Yes — this is a good DevOps-focused version. With Node.js + Express + Docker Compose + Terraform + EC2, your project will look much stronger than a simple hosted Render/Railway deployment.

The key is: do not overbuild the AI app. Build a small working voice agent and spend your effort showing production-readiness.

Recommended stack
Voice Platform:     Vapi
Backend:            Node.js + Express
Database:           PostgreSQL container on EC2
Deployment:         Docker + Docker Compose
Infrastructure:     Terraform + AWS EC2
Reverse Proxy:      Caddy or Nginx
Secrets:            AWS SSM Parameter Store
Backups:            pg_dump → S3
Monitoring:         Health endpoints + CloudWatch + optional Prometheus metrics
Docs:               README + Swagger/OpenAPI
CI/CD:              GitHub Actions

Use Vapi for the phone layer because its Server URL feature allows your backend to receive conversation events, tool calls, transcripts, and call updates. Vapi also supports custom tools, which is exactly what you need for “collect patient info and send it to backend.”

Terraform should create the EC2 instance and supporting AWS resources. Terraform’s AWS provider supports creating and managing EC2 instances as infrastructure-as-code. Docker Compose is also a good fit here because it is designed for defining and running multi-container applications.

Final architecture
Caller
  ↓
Vapi Phone Number
  ↓
Vapi Voice Assistant
  ↓
Webhook / Tool Call
  ↓
HTTPS Endpoint on EC2
  ↓
Caddy / Nginx Reverse Proxy
  ↓
Node.js Express API
  ↓
PostgreSQL Container

Operational Layer:
GitHub Actions
Terraform
Docker Compose
CloudWatch Logs
S3 Backups
SSM Parameter Store
Health / Readiness / Metrics endpoints
Swagger API docs
Important HTTPS decision

For the voice webhook, you ideally need a public HTTPS URL.

Best option

Use:

your-domain.com → EC2 Elastic IP → Caddy → Node.js container

Caddy is useful because it can automatically provision and renew HTTPS certificates for public domain names.

Fast fallback

Use:

EC2 public IP + HTTP

This is weaker from a production-readiness perspective. If you use this fallback, clearly document:

For this time-bound challenge, HTTP was used for demo speed.
Production deployment should use HTTPS through Caddy/ACM/ALB/CloudFront.

For a stronger submission, use a domain and Caddy.

What your repository should look like
carecloud-voice-agent/
│
├── app/
│   ├── src/
│   │   ├── server.js
│   │   ├── app.js
│   │   ├── config/
│   │   │   ├── env.js
│   │   │   └── logger.js
│   │   ├── routes/
│   │   │   ├── health.routes.js
│   │   │   ├── vapi.routes.js
│   │   │   ├── intake.routes.js
│   │   │   ├── calls.routes.js
│   │   │   ├── backup.routes.js
│   │   │   └── docs.routes.js
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── db/
│   │   │   ├── pool.js
│   │   │   ├── migrations/
│   │   │   └── schema.sql
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   ├── requestLogger.js
│   │   │   └── rateLimiter.js
│   │   ├── metrics/
│   │   │   └── prometheus.js
│   │   └── utils/
│   │       └── mask.js
│   │
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── infra/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── ec2.tf
│   ├── networking.tf
│   ├── iam.tf
│   ├── s3-backups.tf
│   ├── cloudwatch.tf
│   └── user-data.sh
│
├── deploy/
│   ├── docker-compose.yml
│   ├── Caddyfile
│   ├── prometheus.yml
│   └── scripts/
│       ├── deploy.sh
│       ├── backup.sh
│       ├── restore.sh
│       └── put-secrets.sh
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── README.md
└── docs/
    ├── ARCHITECTURE.md
    ├── API.md
    ├── RUNBOOK.md
    ├── SECURITY.md
    ├── BACKUP_RECOVERY.md
    └── DECISIONS.md
Node.js packages to use
npm install express pg dotenv helmet cors pino pino-http zod
npm install prom-client swagger-ui-express swagger-jsdoc
npm install express-rate-limit uuid
npm install --save-dev nodemon jest supertest eslint

Use:

express              API server
pg                   PostgreSQL connection
pino                 structured JSON logs
helmet               security headers
zod                  request validation
prom-client          /metrics endpoint
swagger-ui-express   endpoint documentation
express-rate-limit   basic abuse protection
Required API endpoints
Public operational endpoints
Method	Endpoint	Purpose
GET	/healthz	Basic health check
GET	/readyz	Checks database readiness
GET	/metrics	Prometheus-style application metrics
GET	/docs	Swagger/OpenAPI documentation
Vapi webhook endpoint
Method	Endpoint	Purpose
POST	/api/v1/vapi/webhook	Receives Vapi events, tool calls, transcripts, and call reports
Admin/testing endpoints

Protect these using x-api-key.

Method	Endpoint	Purpose
GET	/api/v1/calls	List recent calls
GET	/api/v1/calls/:id	Get one call with transcript/summary
GET	/api/v1/intakes	List collected patient-intake records
GET	/api/v1/intakes/:id	Get one intake record
POST	/api/v1/admin/backup	Trigger manual DB backup
GET	/api/v1/admin/status	Show app, DB, uptime, version, environment
Endpoint documentation examples

Your README or Swagger should document endpoints like this.

GET /healthz

Checks whether the Node.js process is alive.

Response:

{
  "status": "ok",
  "service": "carecloud-voice-agent",
  "timestamp": "2026-07-09T10:00:00.000Z"
}
GET /readyz

Checks whether the app can connect to PostgreSQL.

Response:

{
  "status": "ready",
  "database": "connected",
  "timestamp": "2026-07-09T10:00:00.000Z"
}
GET /metrics

Returns metrics such as:

http_requests_total
http_request_duration_seconds
vapi_webhook_events_total
patient_intakes_created_total
database_errors_total

Prometheus is commonly used for metrics and querying time-series monitoring data.

POST /api/v1/vapi/webhook

Receives Vapi events.

Headers:

x-vapi-secret: <secret>
content-type: application/json

Example tool call payload:

{
  "message": {
    "type": "tool-calls",
    "call": {
      "id": "call_123"
    },
    "toolCalls": [
      {
        "id": "tool_123",
        "function": {
          "name": "create_patient_intake",
          "arguments": {
            "fullName": "Test Patient",
            "dateOfBirth": "1998-02-10",
            "phone": "+15551234567",
            "reason": "Appointment request",
            "preferredCallbackTime": "Morning",
            "consent": true
          }
        }
      }
    ]
  }
}

Response:

{
  "results": [
    {
      "toolCallId": "tool_123",
      "result": {
        "success": true,
        "intakeId": "7b4e2a63-2c4e-47dd-b60c-9a7d96f6a111",
        "message": "Patient intake has been recorded."
      }
    }
  ]
}
Database schema

Keep it simple.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vapi_call_id TEXT UNIQUE,
  caller_number TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  transcript TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE patient_intakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID REFERENCES calls(id),
  full_name TEXT NOT NULL,
  date_of_birth TEXT,
  phone TEXT,
  reason TEXT,
  preferred_callback_time TEXT,
  consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vapi_call_id TEXT,
  event_type TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

For healthcare safety, write in the README:

This is a technical assessment demo. It must only be tested with synthetic/fake patient data.
No real PHI should be entered. Production HIPAA readiness would require BAA-covered vendors,
encryption controls, access auditing, retention policies, and compliance review.
Dockerfile
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]
Docker Compose

Use this for EC2 deployment.

services:
  api:
    build:
      context: ../app
      dockerfile: Dockerfile
    container_name: carecloud-api
    restart: unless-stopped
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3000:3000"
    logging:
      driver: awslogs
      options:
        awslogs-region: ${AWS_REGION}
        awslogs-group: /carecloud/voice-agent
        awslogs-stream: api
        awslogs-create-group: "true"

  postgres:
    image: postgres:16-alpine
    container_name: carecloud-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: carecloud
      POSTGRES_USER: carecloud_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ../app/src/db/schema.sql:/docker-entrypoint-initdb.d/schema.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U carecloud_user -d carecloud"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: awslogs
      options:
        awslogs-region: ${AWS_REGION}
        awslogs-group: /carecloud/voice-agent
        awslogs-stream: postgres
        awslogs-create-group: "true"

  caddy:
    image: caddy:2-alpine
    container_name: carecloud-caddy
    restart: unless-stopped
    depends_on:
      - api
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config

volumes:
  postgres_data:
  caddy_data:
  caddy_config:
Caddyfile

With domain:

your-domain.com {
  reverse_proxy api:3000
}

Without domain, for fast testing:

:80 {
  reverse_proxy api:3000
}

Again, domain + HTTPS is better.

Terraform infrastructure

Your Terraform should create:

VPC
Public subnet
Internet gateway
Route table
Security group
EC2 instance
Elastic IP
IAM role for EC2
S3 bucket for backups
CloudWatch log group
CloudWatch alarm
Optional CloudWatch dashboard

AWS CloudWatch can collect and monitor logs and metrics from EC2 and application infrastructure; the CloudWatch agent can also collect more detailed metrics, logs, and traces from EC2 instances.

AWS Systems Manager Parameter Store supports SecureString parameters encrypted with AWS KMS, which is good for a lightweight challenge-level secret-management approach. For a more advanced production system, AWS Secrets Manager is designed for managing and rotating credentials/API keys.

Terraform file breakdown
infra/main.tf
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
infra/variables.tf
variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "carecloud-voice-agent"
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "allowed_ssh_cidr" {
  type        = string
  description = "Your IP in CIDR format. Example: 203.0.113.10/32"
}

variable "domain_name" {
  type        = string
  default     = ""
  description = "Optional domain name for Caddy HTTPS"
}
infra/networking.tf
resource "aws_vpc" "main" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.20.1.0/24"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
infra/security.tf
resource "aws_security_group" "app" {
  name        = "${var.project_name}-sg"
  description = "Security group for CareCloud voice agent"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH restricted to my IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    description = "Outbound internet access"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-sg"
  }
}

For a stronger security story, say:

SSH is restricted to my own IP for the challenge.
Production should disable SSH and use AWS SSM Session Manager.
infra/iam.tf
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "ec2_policy" {
  name = "${var.project_name}-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ],
        Resource = [
          aws_s3_bucket.backups.arn,
          "${aws_s3_bucket.backups.arn}/*"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ],
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/carecloud/*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-instance-profile"
  role = aws_iam_role.ec2_role.name
}
infra/s3-backups.tf
resource "aws_s3_bucket" "backups" {
  bucket = "${var.project_name}-backups-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.project_name}-backups"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "expire-old-backups"
    status = "Enabled"

    expiration {
      days = 7
    }
  }
}
infra/cloudwatch.tf
resource "aws_cloudwatch_log_group" "app" {
  name              = "/carecloud/voice-agent"
  retention_in_days = 7
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    InstanceId = aws_instance.app.id
  }
}
infra/ec2.tf
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = templatefile("${path.module}/user-data.sh", {
    project_name = var.project_name
    aws_region   = var.aws_region
    backup_bucket = aws_s3_bucket.backups.bucket
  })

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name = "${var.project_name}-ec2"
  }
}

resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-eip"
  }
}
infra/outputs.tf
output "public_ip" {
  value = aws_eip.app.public_ip
}

output "app_url" {
  value = "http://${aws_eip.app.public_ip}"
}

output "backup_bucket" {
  value = aws_s3_bucket.backups.bucket
}
EC2 user-data
#!/bin/bash
set -e

dnf update -y
dnf install -y docker git awscli cronie

systemctl enable docker
systemctl start docker
systemctl enable crond
systemctl start crond

mkdir -p /opt/carecloud
cd /opt/carecloud

echo "EC2 bootstrap completed for ${project_name}"
echo "AWS_REGION=${aws_region}" > /opt/carecloud/bootstrap.env
echo "BACKUP_BUCKET=${backup_bucket}" >> /opt/carecloud/bootstrap.env

For the challenge, I recommend deploying the app using deploy.sh from your laptop after Terraform finishes. This is simpler than forcing user-data to clone a private repo.

Deployment script

deploy/scripts/deploy.sh

#!/usr/bin/env bash
set -euo pipefail

EC2_HOST="$1"
APP_DIR="/opt/carecloud"

rsync -avz \
  --exclude node_modules \
  --exclude .git \
  ../../carecloud-voice-agent/ "ec2-user@${EC2_HOST}:${APP_DIR}"

ssh "ec2-user@${EC2_HOST}" << 'EOF'
  set -e
  cd /opt/carecloud/deploy
  docker compose down
  docker compose up -d --build
  docker compose ps
EOF
Backup script

deploy/scripts/backup.sh

#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/tmp/carecloud_${TIMESTAMP}.sql.gz"

docker exec carecloud-postgres pg_dump -U carecloud_user carecloud | gzip > "$BACKUP_FILE"

aws s3 cp "$BACKUP_FILE" "s3://${BACKUP_BUCKET}/postgres/${TIMESTAMP}.sql.gz"

rm -f "$BACKUP_FILE"

echo "Backup completed: s3://${BACKUP_BUCKET}/postgres/${TIMESTAMP}.sql.gz"

Add cron:

0 2 * * * /opt/carecloud/deploy/scripts/backup.sh >> /var/log/carecloud-backup.log 2>&1
Restore script

deploy/scripts/restore.sh

#!/usr/bin/env bash
set -euo pipefail

BACKUP_S3_PATH="$1"

aws s3 cp "$BACKUP_S3_PATH" /tmp/restore.sql.gz

gunzip -c /tmp/restore.sql.gz | docker exec -i carecloud-postgres psql -U carecloud_user -d carecloud

echo "Restore completed from $BACKUP_S3_PATH"
Secrets management approach

Do not commit .env.

Use:

.env.example committed
.env generated on EC2
real secrets stored in AWS SSM Parameter Store
EC2 IAM role can read only /carecloud/*

Example .env.example:

NODE_ENV=production
PORT=3000

DATABASE_URL=postgresql://carecloud_user:CHANGE_ME@postgres:5432/carecloud
POSTGRES_PASSWORD=CHANGE_ME

ADMIN_API_KEY=CHANGE_ME
VAPI_WEBHOOK_SECRET=CHANGE_ME

AWS_REGION=us-east-1
BACKUP_BUCKET=CHANGE_ME

Example put-secrets.sh:

#!/usr/bin/env bash
set -euo pipefail

aws ssm put-parameter \
  --name "/carecloud/POSTGRES_PASSWORD" \
  --type "SecureString" \
  --value "$POSTGRES_PASSWORD" \
  --overwrite

aws ssm put-parameter \
  --name "/carecloud/ADMIN_API_KEY" \
  --type "SecureString" \
  --value "$ADMIN_API_KEY" \
  --overwrite

aws ssm put-parameter \
  --name "/carecloud/VAPI_WEBHOOK_SECRET" \
  --type "SecureString" \
  --value "$VAPI_WEBHOOK_SECRET" \
  --overwrite

In README, mention:

Terraform intentionally does not hardcode secret values.
Secrets are stored separately in AWS SSM Parameter Store to avoid exposing them in Git or Terraform state.

This is a strong DevOps point.

Monitoring, logging, and observability

Implement these:

1. Structured logs

Use pino.

Log JSON like:

{
  "level": "info",
  "msg": "patient_intake_created",
  "callId": "call_123",
  "intakeId": "intake_123",
  "durationMs": 34
}

Mask sensitive values:

phone: +1555****567
dateOfBirth: hidden
2. Application metrics

Expose:

http_requests_total
http_request_duration_seconds
vapi_webhook_events_total
vapi_tool_calls_total
patient_intakes_created_total
patient_intake_failures_total
db_query_duration_seconds
3. CloudWatch logs

Docker Compose sends logs to:

/carecloud/voice-agent
4. CloudWatch alarm

At minimum:

High CPU > 80%
EC2 status check failed
5. Operational dashboard

For the challenge, this is enough:

CloudWatch log group
CloudWatch CPU alarm
/healthz
/readyz
/metrics
/admin/status

Optional if time remains:

Prometheus + Grafana containers

But on a small EC2 instance, Prometheus + Grafana + PostgreSQL + Node may be heavy. I would keep Prometheus-style /metrics, but not necessarily run Grafana unless there is time.

Reliability and operational readiness

Add these features:

Docker restart policy: unless-stopped
Postgres healthcheck
App waits for DB readiness
/readiness endpoint
Graceful shutdown in Node.js
Request timeout
Rate limiting
Webhook secret validation
Database connection pooling
Backup and restore scripts
Runbook documentation

In Node.js, handle shutdown:

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received. Closing server.");
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
});
Security checklist

Include this in README:

No real PHI used; synthetic test data only
Webhook secret required for Vapi endpoint
Admin endpoints protected with x-api-key
Secrets stored in AWS SSM Parameter Store
No secrets committed to Git
Security group exposes only 80/443 and restricted SSH
Database is not publicly exposed
PostgreSQL only accessible inside Docker network
EBS root volume encrypted
S3 backups encrypted
Logs mask phone numbers and date of birth
CORS restricted
Helmet security headers enabled
Rate limiting enabled
README sections you should include
# CareCloud Voice AI Agent

## Overview
## Architecture
## Tech Stack
## Voice Agent Flow
## API Endpoints
## Infrastructure Design
## Deployment Guide
## Environment Variables
## Secrets Management
## Monitoring and Observability
## Backup and Recovery
## Security Notes
## Reliability / Operational Readiness
## Known Limitations
## Production Improvements
## Testing Instructions
## Cleanup Instructions
Technical decision-making section

Add this section in README because they explicitly evaluate prioritization.

Example:

## Technical Decisions and Trade-offs

1. Managed voice platform over custom telephony
I used Vapi instead of building SIP/STT/TTS from scratch because the assessment is time-bound and the role is infrastructure-focused. This allowed me to focus on backend reliability, deployment, monitoring, security, and recovery.

2. EC2 + Docker Compose instead of Kubernetes
Kubernetes would be excessive for a 3-hour assessment. EC2 with Docker Compose is simple, reproducible, and enough to demonstrate containerized deployment, infrastructure-as-code, logging, backups, and operational readiness.

3. PostgreSQL container instead of RDS
For the challenge, PostgreSQL runs in Docker to keep cost and setup simple. In production, I would move the database to Amazon RDS with automated backups, PITR, Multi-AZ, encryption, and managed patching.

4. SSM Parameter Store for secrets
SSM Parameter Store is lightweight and sufficient for this challenge. In production, AWS Secrets Manager would be preferred for secret rotation and lifecycle management.

5. CloudWatch and health endpoints over full Grafana stack
The project exposes /healthz, /readyz, and /metrics and ships logs to CloudWatch. This gives basic observability without overloading a small EC2 instance.
3-hour execution plan
Before assessment

Prepare accounts:

AWS
Vapi
GitHub
Domain/DNS if possible
OpenAI API key if Vapi requires your own model key

Prepare local tools:

Node.js 20+
Docker
Terraform
AWS CLI
GitHub CLI optional
Hour 1 — App and voice agent

Build:

Express app
PostgreSQL schema
Vapi webhook
create_patient_intake tool handler
health/readiness endpoints
basic logs

Goal by end of hour 1:

Local Docker Compose works
Webhook can save fake patient intake
Hour 2 — Infrastructure and deployment

Build:

Terraform EC2
Security group
IAM role
S3 backup bucket
CloudWatch log group
Docker Compose deployment

Goal by end of hour 2:

EC2 is running
App is deployed
Public URL works
Hour 3 — Operational readiness and docs

Add:

Swagger docs
README
Backup script
Restore script
CloudWatch notes
Security notes
Runbook
Final Vapi phone test

Goal by end:

Working phone number
GitHub repo
Terraform code
Docker deployment
Operational documentation
Final submission checklist

Your final message to the company should include:

GitHub repository URL
Working phone number
Public backend URL
Swagger docs URL
Health endpoint URL
Metrics endpoint URL
Terraform instructions
Docker Compose deployment instructions
Backup/restore instructions
Known limitations

Example:

Phone number:
+1 XXX XXX XXXX

Application:
https://your-domain.com

Swagger:
https://your-domain.com/docs

Health:
https://your-domain.com/healthz

Metrics:
https://your-domain.com/metrics

Repository:
https://github.com/your-username/carecloud-voice-agent
My recommendation

Use this exact combination:

Vapi
Node.js Express
PostgreSQL
Docker Compose
Terraform
AWS EC2
Caddy
SSM Parameter Store
S3 backups
CloudWatch logs
Swagger docs
GitHub Actions

Do not use Kubernetes, ECS, RDS, ALB, or full Grafana unless they give you more time. For 3 hours, the winning approach is:

Working voice agent first.
Then infrastructure-as-code.
Then observability, security, backup, and documentation.

This will directly match their evaluation criteria without making the solution too complex.

Ok, another change in the architecure. I won't be usng AWS and Docker containers, instead the application will be deployed to Railway along with the database. so I don't need the terraform files, I need postgres container only for running locally. And the repo will be linked to the Railway, it will be deployed automatically. Also, I would be using Prisma instead of running raw sql queries.

Now after this, show me the finalized architecture, code and directory structure.

Understood. I’ll finalize it around Railway as the production platform, Prisma for DB access, and Docker Compose only for local PostgreSQL. This makes the challenge much faster while still showing deployment, observability, backups, security, and operational readiness.

One practical simplification: production will have only two Railway services — the Express app and Railway Postgres. Locally, Docker Compose will run only PostgreSQL; the Node app runs with npm run dev.

Thought for 23s

Perfect. Your finalized setup should now be:

Production:
Vapi → Railway Express API → Railway PostgreSQL → Prisma ORM

Local:
Vapi/ngrok optional → Express API running locally → PostgreSQL Docker container → Prisma ORM

This is much better for a 3-hour assessment because you avoid Terraform, EC2 provisioning, SSH, Docker deployment issues, reverse proxy setup, and manual server operations. Railway can deploy directly from a linked GitHub repo, and Railway’s docs confirm that services linked to GitHub can automatically deploy when commits are pushed to the connected branch.

Finalized architecture
Caller
  ↓
Vapi Phone Number
  ↓
Vapi Voice Assistant
  ↓
Server URL / Tool Call
  ↓
Railway Public HTTPS URL
  ↓
Node.js Express API
  ↓
Prisma ORM
  ↓
Railway PostgreSQL

Operational Layer:
GitHub Repo → Railway Auto Deploy
Railway Variables → Secrets Management
Railway Logs → Application Logging
/healthz → Health Monitoring
/readyz → DB Readiness
/metrics → Prometheus-style Metrics
/docs → API Documentation
Prisma Migrations → Database Schema Management
Backup Script / Railway Backups → Recovery Strategy

Vapi’s Server URL allows your backend to receive and respond to real-time conversation events, and Vapi tool calls can be sent to your server when the assistant needs to perform an action such as saving patient intake information.

Final tech stack
Voice AI:          Vapi
Backend:           Node.js + Express
ORM:               Prisma
Database:          Railway PostgreSQL
Production Deploy: Railway from GitHub
Local DB:          PostgreSQL Docker container
API Docs:          Swagger / OpenAPI
Logging:           Pino JSON logs
Metrics:           prom-client
Validation:        Zod
Security:          Helmet, API key auth, webhook secret, rate limiting
CI/CD:             GitHub Actions + Railway auto-deploy

Railway provides environment/service variables through the service Variables tab, which fits your secrets-management requirement for DATABASE_URL, VAPI_WEBHOOK_SECRET, and ADMIN_API_KEY. Prisma Client is designed for Node.js and TypeScript backends and avoids writing raw SQL for normal application queries.

Final directory structure
carecloud-voice-agent/
│
├── prisma/
│   ├── schema.prisma
│   └── seed.js
│
├── src/
│   ├── app.js
│   ├── server.js
│   │
│   ├── config/
│   │   ├── env.js
│   │   ├── logger.js
│   │   └── swagger.js
│   │
│   ├── db/
│   │   └── prisma.js
│   │
│   ├── routes/
│   │   ├── health.routes.js
│   │   ├── vapi.routes.js
│   │   ├── calls.routes.js
│   │   ├── intakes.routes.js
│   │   ├── admin.routes.js
│   │   └── docs.routes.js
│   │
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── vapi.controller.js
│   │   ├── calls.controller.js
│   │   ├── intakes.controller.js
│   │   └── admin.controller.js
│   │
│   ├── services/
│   │   ├── vapi.service.js
│   │   ├── call.service.js
│   │   ├── intake.service.js
│   │   └── backup.service.js
│   │
│   ├── middleware/
│   │   ├── apiKeyAuth.js
│   │   ├── errorHandler.js
│   │   ├── requestLogger.js
│   │   ├── validateWebhook.js
│   │   └── rateLimiter.js
│   │
│   ├── metrics/
│   │   └── metrics.js
│   │
│   ├── validators/
│   │   └── intake.validator.js
│   │
│   └── utils/
│       ├── asyncHandler.js
│       └── mask.js
│
├── scripts/
│   ├── backup.js
│   └── restore.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY.md
│   ├── OBSERVABILITY.md
│   ├── BACKUP_RECOVERY.md
│   ├── RUNBOOK.md
│   └── DECISIONS.md
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── docker-compose.yml
├── railway.json
├── package.json
├── .env.example
├── .gitignore
└── README.md
Production architecture on Railway

You will create two Railway services:

1. Express API Service
   - Source: GitHub repo
   - Start command: npm run start
   - Public URL: enabled
   - Environment variables added in Railway

2. PostgreSQL Database Service
   - Managed by Railway
   - DATABASE_URL injected into the app service

Railway also has PostgreSQL documentation that recommends regular backups and mentions native backup support for production environments.

Local development architecture
Node.js app:
Runs directly on your machine using npm run dev

PostgreSQL:
Runs locally through docker-compose.yml

Prisma:
Connects to local Postgres using DATABASE_URL from .env

Local command flow:

docker compose up -d
npm install
npx prisma migrate dev
npm run dev
package.json
{
  "name": "carecloud-voice-agent",
  "version": "1.0.0",
  "description": "AI-powered healthcare voice agent backend with Railway, Express, Prisma, and PostgreSQL.",
  "main": "src/server.js",
  "type": "commonjs",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "postinstall": "prisma generate",
    "migrate:dev": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "studio": "prisma studio",
    "seed": "node prisma/seed.js",
    "lint": "eslint src",
    "test": "jest --runInBand",
    "backup": "node scripts/backup.js"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.19.2",
    "express-rate-limit": "^7.4.1",
    "helmet": "^7.1.0",
    "pino": "^9.4.0",
    "pino-http": "^10.3.0",
    "prom-client": "^15.1.3",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1",
    "uuid": "^10.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "eslint": "^9.9.0",
    "jest": "^29.7.0",
    "nodemon": "^3.1.4",
    "supertest": "^7.0.0"
  }
}

For Railway, your deployment command can run migrations before starting:

{
  "scripts": {
    "start": "prisma migrate deploy && node src/server.js"
  }
}

I would use this for the challenge because it automatically applies Prisma migrations on deploy.

railway.json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}

This shows you understand Railway deployment configuration while keeping the setup simple.

.env.example
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://carecloud_user:carecloud_password@localhost:5432/carecloud_voice_agent?schema=public"

VAPI_WEBHOOK_SECRET="change-me"
ADMIN_API_KEY="change-me"

CORS_ORIGIN="*"
LOG_LEVEL="info"

SERVICE_NAME="carecloud-voice-agent"
SERVICE_VERSION="1.0.0"

On Railway, you will set:

DATABASE_URL
VAPI_WEBHOOK_SECRET
ADMIN_API_KEY
NODE_ENV=production
LOG_LEVEL=info
SERVICE_NAME=carecloud-voice-agent
SERVICE_VERSION=1.0.0
Local docker-compose.yml

This is only for local PostgreSQL.

services:
  postgres:
    image: postgres:16-alpine
    container_name: carecloud-postgres-local
    restart: unless-stopped
    environment:
      POSTGRES_DB: carecloud_voice_agent
      POSTGRES_USER: carecloud_user
      POSTGRES_PASSWORD: carecloud_password
    ports:
      - "5432:5432"
    volumes:
      - carecloud_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U carecloud_user -d carecloud_voice_agent"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  carecloud_postgres_data:

No app Dockerfile is needed now because Railway will build and run the Node.js app directly from GitHub.

Prisma schema

prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum CallStatus {
  STARTED
  IN_PROGRESS
  COMPLETED
  FAILED
  UNKNOWN
}

enum IntakeReason {
  APPOINTMENT
  BILLING
  PRESCRIPTION
  GENERAL
  OTHER
}

model Call {
  id           String      @id @default(uuid())
  vapiCallId   String?     @unique
  callerNumber String?
  status       CallStatus  @default(UNKNOWN)
  startedAt    DateTime?
  endedAt      DateTime?
  transcript   String?
  summary      String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  intakes      PatientIntake[]
  events       WebhookEvent[]

  @@index([vapiCallId])
  @@index([createdAt])
}

model PatientIntake {
  id                    String       @id @default(uuid())
  callId                String?
  call                  Call?        @relation(fields: [callId], references: [id])
  fullName              String
  dateOfBirth           String?
  phone                 String?
  reason                IntakeReason @default(OTHER)
  reasonDescription     String?
  preferredCallbackTime String?
  consent               Boolean      @default(false)
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  @@index([callId])
  @@index([createdAt])
}

model WebhookEvent {
  id         String   @id @default(uuid())
  callId     String?
  call       Call?    @relation(fields: [callId], references: [id])
  vapiCallId String?
  eventType  String
  payload    Json
  createdAt  DateTime @default(now())

  @@index([vapiCallId])
  @@index([eventType])
  @@index([createdAt])
}
Express app setup
src/server.js
const { app } = require("./app");
const { env } = require("./config/env");
const { logger } = require("./config/logger");
const { prisma } = require("./db/prisma");

const server = app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      service: env.SERVICE_NAME,
      version: env.SERVICE_VERSION
    },
    "server_started"
  );
});

async function shutdown(signal) {
  logger.info({ signal }, "shutdown_started");

  server.close(async () => {
    await prisma.$disconnect();
    logger.info("shutdown_completed");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
src/app.js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const { env } = require("./config/env");
const { requestLogger } = require("./middleware/requestLogger");
const { rateLimiter } = require("./middleware/rateLimiter");
const { errorHandler } = require("./middleware/errorHandler");

const healthRoutes = require("./routes/health.routes");
const vapiRoutes = require("./routes/vapi.routes");
const callsRoutes = require("./routes/calls.routes");
const intakesRoutes = require("./routes/intakes.routes");
const adminRoutes = require("./routes/admin.routes");
const docsRoutes = require("./routes/docs.routes");

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);
app.use(rateLimiter);

app.use("/", healthRoutes);
app.use("/docs", docsRoutes);
app.use("/api/v1/vapi", vapiRoutes);
app.use("/api/v1/calls", callsRoutes);
app.use("/api/v1/intakes", intakesRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use(errorHandler);

module.exports = { app };
Config files
src/config/env.js
require("dotenv").config();

function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 3000),

  DATABASE_URL: required("DATABASE_URL"),

  VAPI_WEBHOOK_SECRET: required("VAPI_WEBHOOK_SECRET"),
  ADMIN_API_KEY: required("ADMIN_API_KEY"),

  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  SERVICE_NAME: process.env.SERVICE_NAME || "carecloud-voice-agent",
  SERVICE_VERSION: process.env.SERVICE_VERSION || "1.0.0"
};

module.exports = { env };
src/config/logger.js
const pino = require("pino");
const { env } = require("./env");

const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: env.SERVICE_NAME,
    version: env.SERVICE_VERSION,
    environment: env.NODE_ENV
  }
});

module.exports = { logger };
src/db/prisma.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: ["error", "warn"]
});

module.exports = { prisma };
Health and readiness endpoints
src/routes/health.routes.js
const express = require("express");
const {
  healthCheck,
  readinessCheck,
  metrics
} = require("../controllers/health.controller");

const router = express.Router();

router.get("/healthz", healthCheck);
router.get("/readyz", readinessCheck);
router.get("/metrics", metrics);

module.exports = router;
src/controllers/health.controller.js
const { prisma } = require("../db/prisma");
const { register } = require("../metrics/metrics");
const { env } = require("../config/env");

async function healthCheck(req, res) {
  res.json({
    status: "ok",
    service: env.SERVICE_NAME,
    version: env.SERVICE_VERSION,
    timestamp: new Date().toISOString()
  });
}

async function readinessCheck(req, res, next) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}

async function metrics(req, res) {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
}

module.exports = {
  healthCheck,
  readinessCheck,
  metrics
};

Small note: this uses prisma.$queryRaw only for a DB readiness check. All business operations still use Prisma models, not raw SQL queries.

Metrics
src/metrics/metrics.js
const client = require("prom-client");

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"]
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

const vapiWebhookEventsTotal = new client.Counter({
  name: "vapi_webhook_events_total",
  help: "Total Vapi webhook events",
  labelNames: ["event_type"]
});

const patientIntakesCreatedTotal = new client.Counter({
  name: "patient_intakes_created_total",
  help: "Total patient intakes created"
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationSeconds);
register.registerMetric(vapiWebhookEventsTotal);
register.registerMetric(patientIntakesCreatedTotal);

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  vapiWebhookEventsTotal,
  patientIntakesCreatedTotal
};
Request logging
src/middleware/requestLogger.js
const pinoHttp = require("pino-http");
const { logger } = require("../config/logger");
const {
  httpRequestsTotal,
  httpRequestDurationSeconds
} = require("../metrics/metrics");

const requestLogger = pinoHttp({
  logger,
  customLogLevel(req, res, error) {
    if (res.statusCode >= 500 || error) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage() {
    return "request_completed";
  },
  customErrorMessage() {
    return "request_failed";
  }
});

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    const route = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });

    httpRequestDurationSeconds.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode
      },
      duration
    );
  });

  next();
}

module.exports = {
  requestLogger: [requestLogger, metricsMiddleware]
};
Rate limiter
src/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { rateLimiter };
API key auth
src/middleware/apiKeyAuth.js
const { env } = require("../config/env");

function apiKeyAuth(req, res, next) {
  const apiKey = req.header("x-api-key");

  if (!apiKey || apiKey !== env.ADMIN_API_KEY) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Valid x-api-key header is required."
    });
  }

  next();
}

module.exports = { apiKeyAuth };
Vapi webhook validation
src/middleware/validateWebhook.js
const { env } = require("../config/env");

function validateVapiWebhook(req, res, next) {
  const secret = req.header("x-vapi-secret");

  if (!secret || secret !== env.VAPI_WEBHOOK_SECRET) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid Vapi webhook secret."
    });
  }

  next();
}

module.exports = { validateVapiWebhook };

In Vapi, configure this same secret as a custom header on your Server URL.

Vapi route
src/routes/vapi.routes.js
const express = require("express");
const { handleVapiWebhook } = require("../controllers/vapi.controller");
const { validateVapiWebhook } = require("../middleware/validateWebhook");

const router = express.Router();

router.post("/webhook", validateVapiWebhook, handleVapiWebhook);

module.exports = router;
Vapi controller
src/controllers/vapi.controller.js
const { processVapiMessage } = require("../services/vapi.service");

async function handleVapiWebhook(req, res, next) {
  try {
    const result = await processVapiMessage(req.body);

    return res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { handleVapiWebhook };
Vapi service
src/services/vapi.service.js
const { prisma } = require("../db/prisma");
const { logger } = require("../config/logger");
const { createPatientIntakeFromToolCall } = require("./intake.service");
const { vapiWebhookEventsTotal } = require("../metrics/metrics");

async function processVapiMessage(payload) {
  const message = payload.message || {};
  const eventType = message.type || "unknown";
  const vapiCallId = message.call?.id || null;

  vapiWebhookEventsTotal.inc({ event_type: eventType });

  const call = await upsertCallFromMessage(message);

  await prisma.webhookEvent.create({
    data: {
      callId: call?.id,
      vapiCallId,
      eventType,
      payload
    }
  });

  logger.info({ eventType, vapiCallId }, "vapi_webhook_received");

  if (eventType === "tool-calls") {
    return handleToolCalls(message, call);
  }

  if (eventType === "end-of-call-report") {
    await saveEndOfCallReport(message, call);
  }

  return {
    received: true,
    eventType
  };
}

async function upsertCallFromMessage(message) {
  const vapiCallId = message.call?.id;

  if (!vapiCallId) {
    return null;
  }

  return prisma.call.upsert({
    where: {
      vapiCallId
    },
    update: {
      status: mapCallStatus(message.type),
      callerNumber: message.call?.customer?.number || undefined
    },
    create: {
      vapiCallId,
      status: mapCallStatus(message.type),
      callerNumber: message.call?.customer?.number || null,
      startedAt: new Date()
    }
  });
}

async function handleToolCalls(message, call) {
  const toolCalls =
    message.toolCallList ||
    message.toolCalls ||
    [];

  const results = [];

  for (const toolCall of toolCalls) {
    const name =
      toolCall.function?.name ||
      toolCall.name;

    const toolCallId =
      toolCall.id ||
      toolCall.toolCall?.id;

    const args =
      toolCall.function?.arguments ||
      toolCall.parameters ||
      toolCall.toolCall?.parameters ||
      {};

    if (name === "create_patient_intake") {
      const intake = await createPatientIntakeFromToolCall({
        callId: call?.id,
        args
      });

      results.push({
        toolCallId,
        result: {
          success: true,
          intakeId: intake.id,
          message: "Patient intake has been recorded successfully."
        }
      });
    } else {
      results.push({
        toolCallId,
        result: {
          success: false,
          message: `Unknown tool: ${name}`
        }
      });
    }
  }

  return { results };
}

async function saveEndOfCallReport(message, call) {
  if (!call) return;

  await prisma.call.update({
    where: {
      id: call.id
    },
    data: {
      status: "COMPLETED",
      endedAt: new Date(),
      transcript: message.transcript || null,
      summary: message.summary || null
    }
  });
}

function mapCallStatus(eventType) {
  if (eventType === "status-update") return "IN_PROGRESS";
  if (eventType === "end-of-call-report") return "COMPLETED";
  return "UNKNOWN";
}

module.exports = {
  processVapiMessage
};
Intake validation
src/validators/intake.validator.js
const { z } = require("zod");

const createIntakeSchema = z.object({
  fullName: z.string().min(2),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  reason: z
    .enum(["APPOINTMENT", "BILLING", "PRESCRIPTION", "GENERAL", "OTHER"])
    .default("OTHER"),
  reasonDescription: z.string().optional(),
  preferredCallbackTime: z.string().optional(),
  consent: z.boolean().default(false)
});

module.exports = {
  createIntakeSchema
};
Intake service
src/services/intake.service.js
const { prisma } = require("../db/prisma");
const { createIntakeSchema } = require("../validators/intake.validator");
const { patientIntakesCreatedTotal } = require("../metrics/metrics");
const { logger } = require("../config/logger");
const { maskPhone } = require("../utils/mask");

async function createPatientIntakeFromToolCall({ callId, args }) {
  const normalizedArgs = normalizeToolArgs(args);
  const validated = createIntakeSchema.parse(normalizedArgs);

  const intake = await prisma.patientIntake.create({
    data: {
      callId,
      fullName: validated.fullName,
      dateOfBirth: validated.dateOfBirth,
      phone: validated.phone,
      reason: validated.reason,
      reasonDescription: validated.reasonDescription,
      preferredCallbackTime: validated.preferredCallbackTime,
      consent: validated.consent
    }
  });

  patientIntakesCreatedTotal.inc();

  logger.info(
    {
      intakeId: intake.id,
      callId,
      phone: maskPhone(intake.phone)
    },
    "patient_intake_created"
  );

  return intake;
}

function normalizeToolArgs(args) {
  if (typeof args === "string") {
    return JSON.parse(args);
  }

  return {
    fullName: args.fullName || args.full_name,
    dateOfBirth: args.dateOfBirth || args.date_of_birth || args.dob,
    phone: args.phone,
    reason: normalizeReason(args.reason),
    reasonDescription: args.reasonDescription || args.reason_description,
    preferredCallbackTime:
      args.preferredCallbackTime || args.preferred_callback_time,
    consent: Boolean(args.consent)
  };
}

function normalizeReason(reason) {
  if (!reason) return "OTHER";

  const value = String(reason).toUpperCase();

  if (value.includes("APPOINT")) return "APPOINTMENT";
  if (value.includes("BILL")) return "BILLING";
  if (value.includes("PRESCRIPTION")) return "PRESCRIPTION";
  if (value.includes("GENERAL")) return "GENERAL";

  return "OTHER";
}

module.exports = {
  createPatientIntakeFromToolCall
};
Calls endpoints
src/routes/calls.routes.js
const express = require("express");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
const {
  listCalls,
  getCallById
} = require("../controllers/calls.controller");

const router = express.Router();

router.get("/", apiKeyAuth, listCalls);
router.get("/:id", apiKeyAuth, getCallById);

module.exports = router;
src/controllers/calls.controller.js
const { prisma } = require("../db/prisma");

async function listCalls(req, res, next) {
  try {
    const calls = await prisma.call.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 25,
      include: {
        intakes: true
      }
    });

    res.json({ data: calls });
  } catch (error) {
    next(error);
  }
}

async function getCallById(req, res, next) {
  try {
    const call = await prisma.call.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        intakes: true,
        events: {
          orderBy: {
            createdAt: "desc"
          },
          take: 20
        }
      }
    });

    if (!call) {
      return res.status(404).json({
        error: "Not Found",
        message: "Call not found."
      });
    }

    res.json({ data: call });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCalls,
  getCallById
};
Intakes endpoints
src/routes/intakes.routes.js
const express = require("express");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
const {
  listIntakes,
  getIntakeById
} = require("../controllers/intakes.controller");

const router = express.Router();

router.get("/", apiKeyAuth, listIntakes);
router.get("/:id", apiKeyAuth, getIntakeById);

module.exports = router;
src/controllers/intakes.controller.js
const { prisma } = require("../db/prisma");

async function listIntakes(req, res, next) {
  try {
    const intakes = await prisma.patientIntake.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 25,
      include: {
        call: true
      }
    });

    res.json({ data: intakes });
  } catch (error) {
    next(error);
  }
}

async function getIntakeById(req, res, next) {
  try {
    const intake = await prisma.patientIntake.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        call: true
      }
    });

    if (!intake) {
      return res.status(404).json({
        error: "Not Found",
        message: "Intake not found."
      });
    }

    res.json({ data: intake });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listIntakes,
  getIntakeById
};
Admin endpoints
src/routes/admin.routes.js
const express = require("express");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
const {
  adminStatus,
  backupInstructions
} = require("../controllers/admin.controller");

const router = express.Router();

router.get("/status", apiKeyAuth, adminStatus);
router.post("/backup", apiKeyAuth, backupInstructions);

module.exports = router;
src/controllers/admin.controller.js
const os = require("os");
const { env } = require("../config/env");
const { prisma } = require("../db/prisma");

async function adminStatus(req, res, next) {
  try {
    const [callCount, intakeCount, eventCount] = await Promise.all([
      prisma.call.count(),
      prisma.patientIntake.count(),
      prisma.webhookEvent.count()
    ]);

    res.json({
      service: env.SERVICE_NAME,
      version: env.SERVICE_VERSION,
      environment: env.NODE_ENV,
      uptimeSeconds: process.uptime(),
      memory: process.memoryUsage(),
      host: os.hostname(),
      counts: {
        calls: callCount,
        intakes: intakeCount,
        webhookEvents: eventCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}

async function backupInstructions(req, res) {
  res.status(202).json({
    message: "For this Railway deployment, backups are handled using Railway database backups and the manual pg_dump script documented in docs/BACKUP_RECOVERY.md.",
    command: "npm run backup"
  });
}

module.exports = {
  adminStatus,
  backupInstructions
};
Error handler
src/middleware/errorHandler.js
const { ZodError } = require("zod");
const { logger } = require("../config/logger");

function errorHandler(error, req, res, next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Validation Error",
      details: error.errors
    });
  }

  logger.error(
    {
      err: error,
      path: req.path,
      method: req.method
    },
    "unhandled_error"
  );

  res.status(500).json({
    error: "Internal Server Error",
    message: "An unexpected error occurred."
  });
}

module.exports = { errorHandler };
Mask utility
src/utils/mask.js
function maskPhone(phone) {
  if (!phone) return null;

  const value = String(phone);

  if (value.length <= 4) return "****";

  return `${value.slice(0, 3)}****${value.slice(-2)}`;
}

module.exports = {
  maskPhone
};
Swagger documentation
src/config/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CareCloud Voice Agent API",
      version: "1.0.0",
      description: "Operational backend API for an AI-powered healthcare voice agent."
    },
    servers: [
      {
        url: "/",
        description: "Current environment"
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key"
        },
        VapiSecret: {
          type: "apiKey",
          in: "header",
          name: "x-vapi-secret"
        }
      }
    }
  },
  apis: ["./src/routes/*.js"]
});

module.exports = { swaggerSpec };
src/routes/docs.routes.js
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const { swaggerSpec } = require("../config/swagger");

const router = express.Router();

router.use("/", swaggerUi.serve);
router.get("/", swaggerUi.setup(swaggerSpec));

module.exports = router;

Add Swagger comments in route files. Example:

/**
 * @openapi
 * /healthz:
 *   get:
 *     summary: Basic health check
 *     responses:
 *       200:
 *         description: Service is alive
 */
Backup script
scripts/backup.js
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const backupsDir = path.join(process.cwd(), "backups");

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputFile = path.join(backupsDir, `backup-${timestamp}.sql`);

execFileSync("pg_dump", [databaseUrl, "-f", outputFile], {
  stdio: "inherit"
});

console.log(`Backup completed: ${outputFile}`);

In README, mention that Railway’s native database backups should be used for production-style recovery, while this script demonstrates a manual pg_dump backup path. Railway’s PostgreSQL docs specifically recommend regular backups and point to native backups for production environments.

GitHub Actions CI
.github/workflows/ci.yml
name: CI

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

jobs:
  validate:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: carecloud_voice_agent
          POSTGRES_USER: carecloud_user
          POSTGRES_PASSWORD: carecloud_password
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U carecloud_user -d carecloud_voice_agent"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://carecloud_user:carecloud_password@localhost:5432/carecloud_voice_agent?schema=public
      VAPI_WEBHOOK_SECRET: test-secret
      ADMIN_API_KEY: test-admin-key
      NODE_ENV: test

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Run Prisma migrations
        run: npx prisma migrate deploy

      - name: Run tests
        run: npm test

Railway handles production deployment from GitHub, so GitHub Actions only needs to prove code quality and migrations.

API endpoint documentation

Your final API should have these endpoints:

Method	Endpoint	Auth	Purpose
GET	/healthz	Public	Confirms app process is alive
GET	/readyz	Public	Confirms database connection works
GET	/metrics	Public or protected	Prometheus-style app metrics
GET	/docs	Public	Swagger API docs
POST	/api/v1/vapi/webhook	x-vapi-secret	Receives Vapi events and tool calls
GET	/api/v1/calls	x-api-key	Lists recent calls
GET	/api/v1/calls/:id	x-api-key	Gets one call with events/intakes
GET	/api/v1/intakes	x-api-key	Lists patient intake records
GET	/api/v1/intakes/:id	x-api-key	Gets one intake record
GET	/api/v1/admin/status	x-api-key	Operational app status
POST	/api/v1/admin/backup	x-api-key	Backup instructions/manual trigger response
Vapi tool definition

Create a Vapi custom tool:

{
  "name": "create_patient_intake",
  "description": "Save basic patient callback information collected during the call.",
  "parameters": {
    "type": "object",
    "properties": {
      "fullName": {
        "type": "string",
        "description": "Patient's full name"
      },
      "dateOfBirth": {
        "type": "string",
        "description": "Patient date of birth"
      },
      "phone": {
        "type": "string",
        "description": "Callback phone number"
      },
      "reason": {
        "type": "string",
        "enum": ["APPOINTMENT", "BILLING", "PRESCRIPTION", "GENERAL", "OTHER"]
      },
      "reasonDescription": {
        "type": "string"
      },
      "preferredCallbackTime": {
        "type": "string"
      },
      "consent": {
        "type": "boolean"
      }
    },
    "required": ["fullName", "reason", "consent"]
  }
}

Server URL:

https://your-railway-app.up.railway.app/api/v1/vapi/webhook

Custom header:

x-vapi-secret: your-secret
Vapi assistant system prompt

Use this:

You are CareCloud's AI intake assistant. Your job is to answer incoming calls, greet the caller, explain that this is a demo intake assistant, collect basic callback information, and save it using the create_patient_intake tool.

Important safety rules:
- Do not provide medical advice.
- Do not diagnose, prescribe, or recommend treatment.
- If the caller mentions an emergency, chest pain, severe bleeding, breathing difficulty, or any urgent medical situation, tell them to call emergency services immediately.
- Ask the caller not to share sensitive medical details.
- Collect only basic callback information.

Collect:
1. Full name
2. Date of birth
3. Callback phone number
4. Reason for call: appointment, billing, prescription, general, or other
5. Preferred callback time
6. Consent to save this information for callback

After collecting the information, call create_patient_intake.
Then confirm that the request has been recorded and a staff member can follow up.
Deployment process
Local
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev --name init
npm run dev

Test:

curl http://localhost:3000/healthz
curl http://localhost:3000/readyz
curl http://localhost:3000/metrics
Railway
Push repo to GitHub.
Create Railway project.
Add PostgreSQL service.
Add app service from GitHub repo.
Add Railway variables:
DATABASE_URL
VAPI_WEBHOOK_SECRET
ADMIN_API_KEY
NODE_ENV=production
LOG_LEVEL=info
SERVICE_NAME=carecloud-voice-agent
SERVICE_VERSION=1.0.0
Deploy.
Open:
https://your-app.up.railway.app/healthz
https://your-app.up.railway.app/readyz
https://your-app.up.railway.app/docs
https://your-app.up.railway.app/metrics
Set Vapi Server URL to:
https://your-app.up.railway.app/api/v1/vapi/webhook
README sections you should include
# CareCloud Voice AI Agent

## Overview
## Architecture
## Tech Stack
## Voice Agent Flow
## API Documentation
## Local Development
## Railway Deployment
## Environment Variables
## Prisma Migrations
## Monitoring and Observability
## Logging Strategy
## Backup and Recovery
## Secrets Management
## Security Controls
## Reliability and Operational Readiness
## Technical Decisions and Trade-offs
## Known Limitations
## Production Improvements
## Testing Instructions
Evaluation criteria mapping
Deployment and infrastructure design
- Railway app service connected to GitHub
- Railway PostgreSQL database service
- Prisma migrations applied during deployment
- Production URL used as Vapi webhook Server URL
Monitoring, logging, and observability
- /healthz for basic health
- /readyz for DB readiness
- /metrics for Prometheus-style metrics
- Railway logs with structured JSON using Pino
- /api/v1/admin/status for operational status
Backup and recovery strategy
- Railway native database backups for managed DB recovery
- Manual pg_dump script for export
- Restore process documented in docs/BACKUP_RECOVERY.md
- RPO/RTO stated clearly
Secrets management and security
- Railway variables for secrets
- No .env committed
- Vapi webhook protected with x-vapi-secret
- Admin endpoints protected with x-api-key
- Helmet security headers
- Rate limiting
- Logs mask phone numbers
- Demo uses synthetic data only
Reliability and operational readiness
- Graceful shutdown
- Prisma connection management
- Readiness checks
- Restart policy in railway.json
- Zod validation
- Error handler
- Runbook documentation
Documentation and deployment process
- README
- /docs Swagger UI
- docs/API.md
- docs/DEPLOYMENT.md
- docs/RUNBOOK.md
- docs/DECISIONS.md
Final recommendation

Use this final architecture:

Vapi + Node.js Express + Prisma + Railway PostgreSQL + Railway GitHub Deploy

Do not add Terraform, EC2, app Dockerfile, Nginx, Caddy, Prometheus server, or Grafana. For this 3-hour task, your strongest submission will be:

1. Working Vapi phone number
2. Railway-deployed Express API
3. Railway PostgreSQL connected through Prisma
4. Webhook saves patient intake successfully
5. Swagger docs
6. Health/readiness/metrics endpoints
7. Railway variables for secrets
8. Backup/recovery docs
9. Clear README and runbook

That directly satisfies the company’s evaluation points without wasting time on infrastructure that Railway already handles.