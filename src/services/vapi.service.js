const { prisma } = require("../db/prisma");
const { logger } = require("../config/logger");
const { createPatientIntakeFromToolCall } = require("./intake.service");
const { vapiWebhookEventsTotal } = require("../metrics/metrics");

async function processVapiMessage(payload) {
  if (isPlainIntakeRequest(payload)) {
    return handlePlainIntakeRequest(payload);
  }

  const message = payload.message || payload;
  const eventType = message.type || payload.type || "unknown";
  const vapiCallId = message.call?.id || payload.call?.id || null;

  vapiWebhookEventsTotal.inc({ event_type: eventType });

  const call = await upsertCallFromMessage(message, eventType);

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

async function handlePlainIntakeRequest(payload) {
  const args = payload.arguments || payload.parameters || payload;

  const intake = await createPatientIntakeFromToolCall({
    callId: null,
    args
  });

  await prisma.webhookEvent.create({
    data: {
      eventType: "api-request-intake",
      payload
    }
  });

  logger.info(
    {
      intakeId: intake.id
    },
    "plain_intake_request_received"
  );

  return {
    success: true,
    intakeId: intake.id,
    message: "Patient intake has been recorded successfully."
  };
}

function isPlainIntakeRequest(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (payload.message || payload.type) return false;

  const args = payload.arguments || payload.parameters || payload;

  return Boolean(
    args.fullName ||
      args.full_name ||
      args.patientName ||
      args.patient_name
  );
}

async function upsertCallFromMessage(message, eventType) {
  const vapiCallId = message.call?.id;

  if (!vapiCallId) {
    return null;
  }

  return prisma.call.upsert({
    where: {
      vapiCallId
    },
    update: {
      status: mapCallStatus(eventType),
      callerNumber: message.call?.customer?.number || undefined
    },
    create: {
      vapiCallId,
      status: mapCallStatus(eventType),
      callerNumber: message.call?.customer?.number || null,
      startedAt: new Date()
    }
  });
}

async function handleToolCalls(message, call) {
  const toolCalls = message.toolCallList || message.toolCalls || [];
  const results = [];

  for (const toolCall of toolCalls) {
    const name = toolCall.function?.name || toolCall.name;
    const toolCallId = toolCall.id || toolCall.toolCall?.id;
    const args =
      toolCall.function?.arguments ||
      toolCall.arguments ||
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
  processVapiMessage,
  mapCallStatus,
  isPlainIntakeRequest
};
