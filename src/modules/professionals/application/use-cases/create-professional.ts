import "server-only";
import { prisma } from "@/shared/database/prisma";
import type { ProfessionalInput } from "../../presentation/schemas/professional";
import { assertTenantServices } from "../tenant-services";

/** RF-05: profissional sem login, com os serviços que executa. */
export async function createProfessional(tenantId: string, input: ProfessionalInput) {
  return prisma.$transaction(async (tx) => {
    await assertTenantServices(tx, tenantId, input.serviceIds);
    const professional = await tx.professional.create({
      data: { tenantId, name: input.name, active: input.active },
      select: { id: true },
    });
    if (input.serviceIds.length) {
      await tx.professionalService.createMany({
        data: input.serviceIds.map((serviceId) => ({ tenantId, professionalId: professional.id, serviceId })),
      });
    }
    return professional;
  });
}
