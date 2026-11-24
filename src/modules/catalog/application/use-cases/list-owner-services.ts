import "server-only";
import { prisma } from "@/shared/database/prisma";

/** Tela P3: todos os serviços da barbearia, ativos primeiro, com quantos profissionais ativos os executam. */
export async function listOwnerServices(tenantId: string) {
  const services = await prisma.service.findMany({
    where: { tenantId },
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      priceCents: true,
      durationMinutes: true,
      active: true,
      professionals: { where: { professional: { active: true } }, select: { professionalId: true } },
    },
  });
  return services.map(({ professionals, ...service }) => ({ ...service, professionalCount: professionals.length }));
}
