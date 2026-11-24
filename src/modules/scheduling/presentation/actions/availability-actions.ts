"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { AppError } from "@/shared/errors/app-error";
import { parseEntityId } from "@/shared/forms/entity-id";
import { invalidForm, type FormState } from "@/shared/forms/form-state";
import {
  createAvailabilityException,
  deleteAvailabilityException,
} from "../../application/use-cases/manage-availability-exceptions";
import { replaceWeeklySchedule } from "../../application/use-cases/manage-weekly-schedule";
import { availabilityExceptionSchema, weeklyScheduleSchema } from "../schemas/availability";

const PROFESSIONAL_NOT_FOUND = "Profissional não encontrado.";

export async function saveWeeklyScheduleAction(
  professionalId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { tenantId } = await requireOwner();
  const parsed = weeklyScheduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Expediente inválido." };

  const id = parseEntityId(professionalId, PROFESSIONAL_NOT_FOUND);
  try {
    await replaceWeeklySchedule(
      tenantId,
      id,
      parsed.data.periods.map((p) => ({ weekday: p.weekday, startMinute: p.start, endMinute: p.end })),
    );
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  revalidatePath("/painel/equipe", "layout");
  return { success: "Expediente salvo." };
}

export async function createExceptionAction(
  professionalId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { tenantId } = await requireOwner();
  const parsed = availabilityExceptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidForm(parsed.error);

  const id = parseEntityId(professionalId, PROFESSIONAL_NOT_FOUND);
  try {
    await createAvailabilityException(tenantId, id, parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/painel/equipe/${id}/folgas`);
  return { success: parsed.data.type === "DAY_OFF" ? "Folga adicionada." : "Bloqueio adicionado." };
}

export async function deleteExceptionAction(professionalId: string, exceptionId: string): Promise<FormState> {
  const { tenantId } = await requireOwner();
  const id = parseEntityId(professionalId, PROFESSIONAL_NOT_FOUND);
  try {
    await deleteAvailabilityException(tenantId, parseEntityId(exceptionId, "Folga ou bloqueio não encontrado."));
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/painel/equipe/${id}/folgas`);
  return { success: "Removido." };
}
