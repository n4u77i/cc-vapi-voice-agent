CREATE TYPE "CallStatus" AS ENUM ('STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'UNKNOWN');

CREATE TYPE "IntakeReason" AS ENUM ('APPOINTMENT', 'BILLING', 'PRESCRIPTION', 'GENERAL', 'OTHER');

CREATE TABLE "Call" (
  "id" TEXT NOT NULL,
  "vapiCallId" TEXT,
  "callerNumber" TEXT,
  "status" "CallStatus" NOT NULL DEFAULT 'UNKNOWN',
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "transcript" TEXT,
  "summary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientIntake" (
  "id" TEXT NOT NULL,
  "callId" TEXT,
  "fullName" TEXT NOT NULL,
  "dateOfBirth" TEXT,
  "phone" TEXT,
  "reason" "IntakeReason" NOT NULL DEFAULT 'OTHER',
  "reasonDescription" TEXT,
  "preferredCallbackTime" TEXT,
  "consent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PatientIntake_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookEvent" (
  "id" TEXT NOT NULL,
  "callId" TEXT,
  "vapiCallId" TEXT,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Call_vapiCallId_key" ON "Call"("vapiCallId");
CREATE INDEX "Call_vapiCallId_idx" ON "Call"("vapiCallId");
CREATE INDEX "Call_createdAt_idx" ON "Call"("createdAt");
CREATE INDEX "PatientIntake_callId_idx" ON "PatientIntake"("callId");
CREATE INDEX "PatientIntake_createdAt_idx" ON "PatientIntake"("createdAt");
CREATE INDEX "WebhookEvent_vapiCallId_idx" ON "WebhookEvent"("vapiCallId");
CREATE INDEX "WebhookEvent_eventType_idx" ON "WebhookEvent"("eventType");
CREATE INDEX "WebhookEvent_createdAt_idx" ON "WebhookEvent"("createdAt");

ALTER TABLE "PatientIntake"
  ADD CONSTRAINT "PatientIntake_callId_fkey"
  FOREIGN KEY ("callId") REFERENCES "Call"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WebhookEvent"
  ADD CONSTRAINT "WebhookEvent_callId_fkey"
  FOREIGN KEY ("callId") REFERENCES "Call"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
