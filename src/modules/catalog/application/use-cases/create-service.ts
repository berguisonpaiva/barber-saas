import "server-only";
import { prisma } from "@/shared/database/prisma";
import type { ServiceInput } from "../../presentation/schemas/service";

/** RF-04. tenantId SEMPRE vem do contexto autenticado (requireOwner). */
export async function createService(tenantId: string, input: ServiceInput) {
  return prisma.$transaction(async (tx) => {
    const service = await tx.service.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description,
        priceCents: input.price,
        durationMinutes: input.durationMinutes,
        active: input.active,
      },
      select: { id: true },
    });
    if (input.professionalIds.length) {
      // A FK composta (tenantId, professionalId) rejeita ids de outro tenant.
      await tx.professionalService.createMany({
        data: input.professionalIds.map((professionalId) => ({ tenantId, professionalId, serviceId: service.id })),
      });
    }
    return service;
  });
}
