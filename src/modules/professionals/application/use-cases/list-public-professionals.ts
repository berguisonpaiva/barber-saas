import "server-only";
import { prisma } from "@/shared/database/prisma";

/** Profissionais ativos; se serviceIds vier, só quem executa todos os serviços. */
export async function listPublicProfessionals(tenantId: string, serviceIds: readonly string[] = []) {
  return prisma.professional.findMany({
    where: {
      tenantId,
      active: true,
      AND: serviceIds.map((serviceId) => ({ services: { some: { serviceId, service: { active: true } } } })),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
