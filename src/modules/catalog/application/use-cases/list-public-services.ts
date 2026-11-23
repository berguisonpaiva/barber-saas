import "server-only";
import { prisma } from "@/shared/database/prisma";

/** Serviços ativos que tenham ao menos um profissional ativo. */
export async function listPublicServices(tenantId: string) {
  return prisma.service.findMany({
    where: { tenantId, active: true, professionals: { some: { professional: { active: true } } } },
    select: { id: true, name: true, description: true, priceCents: true, durationMinutes: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}
