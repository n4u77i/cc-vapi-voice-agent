process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.DATABASE_URL =
  "postgresql://carecloud_user:carecloud_password@localhost:5432/carecloud_voice_agent?schema=public";
process.env.VAPI_WEBHOOK_SECRET = "test-secret";
process.env.ADMIN_API_KEY = "test-admin-key";
process.env.LOG_LEVEL = "silent";

jest.mock("../src/db/prisma", () => {
  const call = {
    id: "call-1",
    vapiCallId: "vapi-call-1",
    callerNumber: "+15551234567",
    status: "UNKNOWN",
    intakes: [],
    events: []
  };

  const intake = {
    id: "intake-1",
    callId: "call-1",
    fullName: "Test Patient",
    reason: "APPOINTMENT",
    consent: true
  };

  return {
    prisma: {
      $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      call: {
        upsert: jest.fn().mockResolvedValue(call),
        findMany: jest.fn().mockResolvedValue([call]),
        findUnique: jest.fn().mockResolvedValue(call),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue({ ...call, status: "COMPLETED" })
      },
      patientIntake: {
        create: jest.fn().mockResolvedValue(intake),
        findMany: jest.fn().mockResolvedValue([intake]),
        findUnique: jest.fn().mockResolvedValue(intake),
        count: jest.fn().mockResolvedValue(1)
      },
      webhookEvent: {
        create: jest.fn().mockResolvedValue({ id: "event-1" }),
        count: jest.fn().mockResolvedValue(1)
      }
    }
  };
});

const request = require("supertest");
const { app } = require("../src/app");
const { prisma } = require("../src/db/prisma");
const { normalizeSecret } = require("../src/middleware/validateWebhook");

describe("CareCloud voice agent API", () => {
  test("GET /healthz returns service status", async () => {
    const response = await request(app).get("/healthz");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("carecloud-voice-agent");
  });

  test("GET /readyz checks database readiness", async () => {
    const response = await request(app).get("/readyz");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ready");
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  test("POST /api/v1/vapi/webhook rejects invalid secret", async () => {
    const response = await request(app)
      .post("/api/v1/vapi/webhook")
      .send({ message: { type: "status-update" } });

    expect(response.status).toBe(401);
  });

  test("POST /api/v1/vapi/webhook stores events", async () => {
    const response = await request(app)
      .post("/api/v1/vapi/webhook")
      .set("x-vapi-secret", "test-secret")
      .send({
        message: {
          type: "status-update",
          call: {
            id: "vapi-call-1",
            customer: {
              number: "+15551234567"
            }
          }
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
    expect(prisma.webhookEvent.create).toHaveBeenCalled();
  });

  test("POST /api/v1/vapi/webhook accepts bearer server secret", async () => {
    const response = await request(app)
      .post("/api/v1/vapi/webhook")
      .set("authorization", "Bearer test-secret")
      .send({
        message: {
          type: "status-update",
          call: {
            id: "vapi-call-1"
          }
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
  });

  test("normalizeSecret extracts a 64-character hex token from wrappers", () => {
    const secret =
      "5046ce6d461ad873cb5133e1904669c94b73dbf5691045db4ec6c52cfffbfaca";

    expect(normalizeSecret(`x${secret}y`)).toBe(secret);
  });

  test("Vapi tool call creates patient intake", async () => {
    const response = await request(app)
      .post("/api/v1/vapi/webhook")
      .set("x-vapi-secret", "test-secret")
      .send({
        message: {
          type: "tool-calls",
          call: {
            id: "vapi-call-1"
          },
          toolCallList: [
            {
              id: "tool-call-1",
              function: {
                name: "create_patient_intake",
                arguments: {
                  fullName: "Test Patient",
                  reason: "appointment",
                  consent: true
                }
              }
            }
          ]
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.results[0].result.success).toBe(true);
    expect(prisma.patientIntake.create).toHaveBeenCalled();
  });

  test("Vapi API Request tool can create patient intake from plain body", async () => {
    const response = await request(app)
      .post("/api/v1/vapi/webhook")
      .set("x-vapi-secret", "test-secret")
      .send({
        fullName: "Test Patient",
        dateOfBirth: "1995-01-01",
        phone: "555-123-4567",
        reason: "APPOINTMENT",
        preferredCallbackTime: "Morning",
        consent: true
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.intakeId).toBe("intake-1");
    expect(prisma.patientIntake.create).toHaveBeenCalled();
  });

  test("admin endpoints require API key", async () => {
    const response = await request(app).get("/api/v1/admin/status");

    expect(response.status).toBe(401);
  });

  test("GET /metrics returns Prometheus text", async () => {
    const response = await request(app).get("/metrics");

    expect(response.status).toBe(200);
    expect(response.text).toContain("http_requests_total");
  });
});
