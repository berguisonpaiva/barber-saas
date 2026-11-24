import { z } from "zod";
import { checkboxField, optionalText } from "@/shared/forms/fields";

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(80, "Use até 80 caracteres."),
  description: optionalText(300),
  /** Aceita "40,00" ou "40.00" e converte para centavos. */
  price: z
    .string()
    .trim()
    .regex(/^\d{1,5}([.,]\d{1,2})?$/, "Preço inválido.")
    .transform((v) => Math.round(Number(v.replace(",", ".")) * 100)),
  durationMinutes: z.coerce
    .number({ error: "Informe a duração." })
    .int("Use minutos inteiros.")
    .min(5, "Mínimo de 5 minutos.")
    .max(480, "Máximo de 8 horas."),
  professionalIds: z.array(z.uuid()).default([]),
  active: checkboxField,
});

export type ServiceInput = z.infer<typeof serviceSchema>;
