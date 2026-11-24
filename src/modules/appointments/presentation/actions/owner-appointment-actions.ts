"use server";

import { revalidatePath } from "next/cache";
import { cancelAppointmentByOwner, recordAttendance } from "@/composition-root";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { AppError } from "@/shared/errors/app-error";
import { parseEntityId } from "@/shared/forms/entity-id";
import type { FormState } from "@/shared/forms/form-state";
import type { AttendanceOutcome } from "../../domain/appointment";

const NOT_FOUND = "Agendamento não encontrado.";
const OUTCOME_MESSAGE: Record<AttendanceOutcome, string> = {
  COMPLETED: "Marcado como atendido.",
  NO_SHOW: "Marcado como falta.",
};

function refreshAgenda() {
  revalidatePath("/painel/agenda", "layout");
  revalidatePath("/painel/resumo");
  revalidatePath("/painel/mais/clientes", "layout");
}

/** Tela P2: Atendido ou Faltou. O valor do resultado é conferido aqui; o id, no escopo da barbearia da sessão. */
export async function recordAttendanceAction(appointmentId: string, outcome: AttendanceOutcome): Promise<FormState> {
  const { tenantId } = await requireOwner();
  if (outcome !== "COMPLETED" && outcome !== "NO_SHOW") return { error: "Situação inválida." };
  try {
    await recordAttendance.execute({ tenantId, appointmentId: parseEntityId(appointmentId, NOT_FOUND), outcome });
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  refreshAgenda();
  return { success: OUTCOME_MESSAGE[outcome] };
}

export async function cancelByOwnerAction(appointmentId: string): Promise<FormState> {
  const { tenantId } = await requireOwner();
  try {
    await cancelAppointmentByOwner.execute({ tenantId, appointmentId: parseEntityId(appointmentId, NOT_FOUND) });
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
  refreshAgenda();
  return { success: "Agendamento cancelado. O horário foi liberado." };
}
