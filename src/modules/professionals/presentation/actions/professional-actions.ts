"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { AppError } from "@/shared/errors/app-error";
import { parseEntityId } from "@/shared/forms/entity-id";
import { invalidForm, type FormState } from "@/shared/forms/form-state";
import { createProfessional } from "../../application/use-cases/create-professional";
import { deleteProfessional } from "../../application/use-cases/delete-professional";
import { setProfessionalActive } from "../../application/use-cases/set-professional-active";
import { updateProfessional } from "../../application/use-cases/update-professional";
import { professionalSchema } from "../schemas/professional";

const NOT_FOUND = "Profissional não encontrado.";

function parseProfessionalForm(formData: FormData) {
  return professionalSchema.safeParse({ ...Object.fromEntries(formData), serviceIds: formData.getAll("serviceIds") });
}

function refreshTeamPages() {
  revalidatePath("/painel/equipe", "layout");
  revalidatePath("/painel/servicos", "layout");
}

/** Depois de criar, segue direto para o expediente: sem ele o profissional não oferece horários. */
export async function createProfessionalAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { tenantId } = await requireOwner();
  const parsed = parseProfessionalForm(formData);
  if (!parsed.success) return invalidForm(parsed.error);

  let professionalId: string;
  try {
    ({ id: professionalId } = await createProfessional(tenantId, parsed.data));
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  refreshTeamPages();
  redirect(`/painel/equipe/${professionalId}/expediente`);
}

export async function updateProfessionalAction(
  professionalId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { tenantId } = await requireOwner();
  const parsed = parseProfessionalForm(formData);
  if (!parsed.success) return invalidForm(parsed.error);

  try {
    await updateProfessional(tenantId, parseEntityId(professionalId, NOT_FOUND), parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  refreshTeamPages();
  return { success: "Dados salvos." };
}

export async function setProfessionalActiveAction(professionalId: string, active: boolean): Promise<FormState> {
  const { tenantId } = await requireOwner();
  try {
    await setProfessionalActive(tenantId, parseEntityId(professionalId, NOT_FOUND), active);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  refreshTeamPages();
  return { success: active ? "Profissional ativado." : "Profissional desativado." };
}

export async function deleteProfessionalAction(professionalId: string): Promise<FormState> {
  const { tenantId } = await requireOwner();
  try {
    await deleteProfessional(tenantId, parseEntityId(professionalId, NOT_FOUND));
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  refreshTeamPages();
  redirect("/painel/equipe");
}
