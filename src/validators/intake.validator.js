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

module.exports = { createIntakeSchema };
