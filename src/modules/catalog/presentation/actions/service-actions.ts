"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { AppError } from "@/shared/errors/app-error";
import { invalidForm, type FormState } from "@/shared/forms/form-state";
import { parseEntityId } from "@/shared/forms/entity-id";
import { createService } from "../../application/use-cases/create-service";
import { updateService } from "../../application/use-cases/update-service";
import { setServiceActive } from "../../application/use-cases/set-service-active";
import { deleteService } from "../../application/use-cases/delete-service";
import { serviceSchema } from "../schemas/service";

const NOT_FOUND = "Serviço não encontrado.";

function parseServiceForm(formData: FormData) {
  return serviceSchema.safeParse({ ...Object.fromEntries(formData), professionalIds: formData.getAll("professionalIds") });
}

function refreshServicePages() {
  revalidatePath("/painel/servicos");
  revalidatePath("/painel/equipe", "layout");
}

/** Padrão de Server Action administrativa: sessão → validação → caso de uso. */
export async function createServiceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { tenantId } = await requireOwner();
  const parsed = parseServiceForm(formData);
  if (!parsed.success) return invalidForm(parsed.error);

  try {
    await createService(tenantId, parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  refreshServicePages();
  redirect("/painel/servicos");
}

export async function updateServiceAction(serviceId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { tenantId } = await requireOwner();
  const parsed = parseServiceForm(formData);
  if (!parsed.success) return invalidForm(parsed.error);

  try {
    await updateService(tenantId, parseEntityId(serviceId, NOT_FOUND), parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  refreshServicePages();
  redirect("/painel/servicos");
}

export async function setServiceActiveAction(serviceId: string, active: boolean): Promise<FormState> {
  const { tenantId } = await requireOwner();
  try {
    await setServiceActive(tenantId, parseEntityId(serviceId, NOT_FOUND), active);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  refreshServicePages();
  return { success: active ? "Serviço ativado." : "Serviço desativado." };
}

export async function deleteServiceAction(serviceId: string): Promise<FormState> {
  const { tenantId } = await requireOwner();
  try {
    await deleteService(tenantId, parseEntityId(serviceId, NOT_FOUND));
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  refreshServicePages();
  redirect("/painel/servicos");
}
