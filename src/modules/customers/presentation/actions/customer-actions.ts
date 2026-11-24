"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { AppError } from "@/shared/errors/app-error";
import { parseEntityId } from "@/shared/forms/entity-id";
import { invalidForm, type FormState } from "@/shared/forms/form-state";
import { updateCustomer } from "../../application/use-cases/update-customer";
import { customerSchema } from "../schemas/customer";

export async function updateCustomerAction(customerId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { tenantId } = await requireOwner();
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidForm(parsed.error);

  try {
    await updateCustomer(tenantId, parseEntityId(customerId, "Cliente não encontrado."), parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  revalidatePath("/painel/mais/clientes", "layout");
  return { success: "Cliente atualizado." };
}
