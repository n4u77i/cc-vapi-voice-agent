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

function normalizeToolArgs(args = {}) {
  const parsedArgs = typeof args === "string" ? JSON.parse(args) : args;

  return {
    fullName:
      parsedArgs.fullName ||
      parsedArgs.full_name ||
      parsedArgs.patientName ||
      parsedArgs.patient_name,
    dateOfBirth:
      parsedArgs.dateOfBirth || parsedArgs.date_of_birth || parsedArgs.dob,
    phone: parsedArgs.phone,
    reason: normalizeReason(parsedArgs.reason),
    reasonDescription:
      parsedArgs.reasonDescription || parsedArgs.reason_description,
    preferredCallbackTime:
      parsedArgs.preferredCallbackTime || parsedArgs.preferred_callback_time,
    consent: Boolean(parsedArgs.consent)
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
  createPatientIntakeFromToolCall,
  normalizeToolArgs,
  normalizeReason
};
