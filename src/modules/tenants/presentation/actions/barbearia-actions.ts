"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { invalidForm, type FormState } from "@/shared/forms/form-state";
import { updateBarbeariaSettings } from "../../application/use-cases/manage-barbearia-settings";
import { barbeariaSettingsSchema } from "../schemas/barbearia-settings";

export async function updateBarbeariaSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { tenantId } = await requireOwner();
  const parsed = barbeariaSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidForm(parsed.error);

  await updateBarbeariaSettings(tenantId, parsed.data);
  revalidatePath("/painel", "layout");
  return { success: "Dados da barbearia salvos." };
}
