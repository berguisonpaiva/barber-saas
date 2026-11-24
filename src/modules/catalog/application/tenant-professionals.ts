import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { ValidationError } from "@/shared/errors/app-error";

/** Garante que todos os profissionais informados pertencem à barbearia (RN-01) antes de vinculá-los. */
export async function assertTenantProfessionals(tx: Prisma.TransactionClient, tenantId: string, professionalIds: string[]) {
  if (!professionalIds.length) return;
  const found = await tx.professional.count({ where: { tenantId, id: { in: professionalIds } } });
  if (found !== new Set(professionalIds).size) throw new ValidationError("Profissional inválido.");
}
