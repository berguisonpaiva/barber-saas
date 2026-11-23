import "server-only";
import { prisma } from "@/shared/database/prisma";

/** Profissionais ativos; se serviceId vier, só quem executa o serviço. */
export async function listPublicProfessionals(tenantId: string, serviceId?: string) {
  return prisma.professional.findMany({
    where: {
      tenantId,
      active: true,
      ...(serviceId ? { services: { some: { serviceId, service: { active: true } } } } : {}),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
