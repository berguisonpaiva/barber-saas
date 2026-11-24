import "server-only";
import { prisma } from "@/shared/database/prisma";
import type { ServiceInput } from "../../presentation/schemas/service";
import { assertTenantProfessionals } from "../tenant-professionals";

/** RF-04. tenantId SEMPRE vem do contexto autenticado (requireOwner). */
export async function createService(tenantId: string, input: ServiceInput) {
  return prisma.$transaction(async (tx) => {
    await assertTenantProfessionals(tx, tenantId, input.professionalIds);
    const last = await tx.service.aggregate({ where: { tenantId }, _max: { sortOrder: true } });
    const service = await tx.service.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description,
        priceCents: input.price,
        durationMinutes: input.durationMinutes,
        active: input.active,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
      select: { id: true },
    });
    if (input.professionalIds.length) {
      await tx.professionalService.createMany({
        data: input.professionalIds.map((professionalId) => ({ tenantId, professionalId, serviceId: service.id })),
      });
    }
    return service;
  });
}
