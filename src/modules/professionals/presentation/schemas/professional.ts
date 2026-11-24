import { z } from "zod";
import { checkboxField } from "@/shared/forms/fields";

export const professionalSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(60, "Use até 60 caracteres."),
  serviceIds: z.array(z.uuid()).default([]),
  active: checkboxField,
});

export type ProfessionalInput = z.infer<typeof professionalSchema>;
