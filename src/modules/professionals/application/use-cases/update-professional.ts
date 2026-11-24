import "server-only";
import { prisma } from "@/shared/database/prisma";
import { NotFoundError } from "@/shared/errors/app-error";
import type { ProfessionalInput } from "../../presentation/schemas/professional";
import { assertTenantServices } from "../tenant-services";

/** RF-05: edita nome, situação e os serviços que o profissional executa. */
export async function updateProfessional(tenantId: string, professionalId: string, input: ProfessionalInput) {
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.professional.updateMany({
      where: { tenantId, id: professionalId },
      data: { name: input.name, active: input.active },
    });
    if (!count) throw new NotFoundError("Profissional não encontrado.");

    await assertTenantServices(tx, tenantId, input.serviceIds);
    await tx.professionalService.deleteMany({ where: { tenantId, professionalId } });
    if (input.serviceIds.length) {
      await tx.professionalService.createMany({
        data: input.serviceIds.map((serviceId) => ({ tenantId, professionalId, serviceId })),
      });
    }
  });
}
