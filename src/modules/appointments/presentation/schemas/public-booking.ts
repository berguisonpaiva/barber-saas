import { z } from "zod";

export const availabilityQuerySchema = z.object({
  serviceId: z.uuid(),
  professionalId: z.uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD."),
});

export const createPublicAppointmentSchema = z.object({
  serviceId: z.uuid(),
  professionalId: z.uuid(),
  startsAt: z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(8).max(25),
  }),
  consent: z.literal(true, { error: "É preciso aceitar o uso dos dados (LGPD)." }),
  /** Honeypot anti-bot: precisa vir vazio (RN-10). */
  website: z.string().max(0).optional(),
});

export const cancelByTokenSchema = z.object({
  token: z.string().min(20).max(100),
});
