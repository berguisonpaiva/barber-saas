import "server-only";
import { prisma } from "@/shared/database/prisma";
import { NotFoundError } from "@/shared/errors/app-error";
import type { ServiceInput } from "../../presentation/schemas/service";
import { assertTenantProfessionals } from "../tenant-professionals";

/**
 * RF-04: edita o serviço e substitui quem o realiza.
 * Agendamentos já marcados guardam snapshot de nome/preço/duração e não mudam.
 */
export async function updateService(tenantId: string, serviceId: string, input: ServiceInput) {
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.service.updateMany({
      where: { tenantId, id: serviceId },
      data: {
        name: input.name,
        description: input.description ?? null,
        priceCents: input.price,
        durationMinutes: input.durationMinutes,
        active: input.active,
      },
    });
    if (!count) throw new NotFoundError("Serviço não encontrado.");

    await assertTenantProfessionals(tx, tenantId, input.professionalIds);
    await tx.professionalService.deleteMany({ where: { tenantId, serviceId } });
    if (input.professionalIds.length) {
      await tx.professionalService.createMany({
        data: input.professionalIds.map((professionalId) => ({ tenantId, professionalId, serviceId })),
      });
    }
  });
}
