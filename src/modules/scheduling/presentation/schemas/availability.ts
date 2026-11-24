import { z } from "zod";
import { clockMinutesField, optionalText } from "@/shared/forms/fields";

/** Expediente enviado pela tela P6 como JSON no campo "periods". */
export const weeklyScheduleSchema = z.object({
  periods: z
    .string()
    .transform((value, ctx) => {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Expediente inválido." });
        return z.NEVER;
      }
    })
    .pipe(
      z
        .array(z.object({ weekday: z.number().int().min(0).max(6), start: clockMinutesField, end: clockMinutesField }))
        .max(28, "Use até 4 períodos por dia."),
    ),
});

const optionalClock = z
  .string()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(clockMinutesField.optional());

/** Folga ou bloqueio (tela P7). */
export const availabilityExceptionSchema = z.object({
  type: z.enum(["DAY_OFF", "BLOCK"], { error: "Escolha folga ou bloqueio." }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha a data."),
  start: optionalClock,
  end: optionalClock,
  reason: optionalText(120),
});

export type AvailabilityExceptionInput = z.infer<typeof availabilityExceptionSchema>;
