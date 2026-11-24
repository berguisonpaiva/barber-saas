import "server-only";
import { prisma } from "@/shared/database/prisma";

/** Serviços para seletores do painel (ex.: "serviços que realiza"), ativos primeiro. */
export async function listServiceOptions(tenantId: string) {
  return prisma.service.findMany({
    where: { tenantId },
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, active: true },
  });
}
