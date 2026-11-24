import "server-only";
import { prisma } from "@/shared/database/prisma";

/** Tela P5 e seletores de "quem realiza": todos os profissionais, ativos primeiro. */
export async function listOwnerProfessionals(tenantId: string) {
  const professionals = await prisma.professional.findMany({
    where: { tenantId },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      active: true,
      services: { where: { service: { active: true } }, select: { serviceId: true } },
      availabilityRules: { select: { weekday: true }, distinct: ["weekday"] },
    },
  });
  return professionals.map(({ services, availabilityRules, ...professional }) => ({
    ...professional,
    serviceCount: services.length,
    workingDays: availabilityRules.map((rule) => rule.weekday).sort((a, b) => a - b),
  }));
}
