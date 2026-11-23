"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { createService } from "../../application/use-cases/create-service";
import { serviceSchema } from "../schemas/service";

export type ServiceFormState = { fieldErrors?: Record<string, string[] | undefined>; error?: string } | undefined;

/** Padrão de Server Action administrativa: sessão → validação → caso de uso. */
export async function createServiceAction(_prev: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  const { tenantId } = await requireOwner();
  const parsed = serviceSchema.safeParse({
    ...Object.fromEntries(formData),
    professionalIds: formData.getAll("professionalIds"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  await createService(tenantId, parsed.data);
  revalidatePath("/painel/servicos");
  redirect("/painel/servicos");
}
