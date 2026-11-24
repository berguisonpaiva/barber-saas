import { z } from "zod";

/** Checkbox de formulário HTML: presente ("on") = true; ausente = false. */
export const checkboxField = z.preprocess((value) => value === "on" || value === "true", z.boolean());

/** Texto opcional: string vazia vira undefined. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use até ${max} caracteres.`)
    .optional()
    .transform((value) => (value ? value : undefined));

/** "HH:MM" → minutos desde 00:00 (aceita "24:00" como fim do dia). */
export const clockMinutesField = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/, "Horário inválido.")
  .transform((value) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  });
