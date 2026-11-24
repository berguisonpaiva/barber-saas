import "server-only";
import { notFound } from "next/navigation";
import { getProfessionalForEdit } from "@/modules/professionals/application/use-cases/get-professional-for-edit";
import { NotFoundError } from "@/shared/errors/app-error";
import { parseEntityId } from "@/shared/forms/entity-id";

/** Profissional da barbearia da sessão ou 404 — usado pelas três abas de edição. */
export async function loadProfessional(tenantId: string, id: string) {
  try {
    return await getProfessionalForEdit(tenantId, parseEntityId(id, "Profissional não encontrado."));
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
