import { z } from "zod";
import { normalizeBrazilPhone } from "@/shared/utils/phone";

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(80, "Use até 80 caracteres."),
  phone: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const normalized = normalizeBrazilPhone(value);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: "WhatsApp inválido. Use DDD + número." });
        return z.NEVER;
      }
      return normalized;
    }),
});

export type CustomerInput = z.infer<typeof customerSchema>;
