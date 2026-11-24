import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { ValidationError } from "@/shared/errors/app-error";

/** Garante que todos os serviços informados pertencem à barbearia (RN-01) antes de vinculá-los. */
export async function assertTenantServices(tx: Prisma.TransactionClient, tenantId: string, serviceIds: string[]) {
  if (!serviceIds.length) return;
  const found = await tx.service.count({ where: { tenantId, id: { in: serviceIds } } });
  if (found !== new Set(serviceIds).size) throw new ValidationError("Serviço inválido.");
}
