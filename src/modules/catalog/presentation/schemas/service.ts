import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome."),
  description: z.string().trim().max(300).optional().or(z.literal("").transform(() => undefined)),
  /** Aceita "40,00" ou "40.00" e converte para centavos. */
  price: z
    .string()
    .trim()
    .regex(/^\d{1,5}([.,]\d{1,2})?$/, "Preço inválido.")
    .transform((v) => Math.round(Number(v.replace(",", ".")) * 100)),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  professionalIds: z.array(z.uuid()).default([]),
  active: z.coerce.boolean().default(true),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
