import "server-only";
import { prisma } from "@/shared/database/prisma";
import { NotFoundError } from "@/shared/errors/app-error";

/** Profissional da barbearia para as abas de edição; inclui se já tem histórico (RN-09). */
export async function getProfessionalForEdit(tenantId: string, professionalId: string) {
  const professional = await prisma.professional.findFirst({
    where: { tenantId, id: professionalId },
    select: {
      id: true,
      name: true,
      active: true,
      services: { select: { serviceId: true } },
      _count: { select: { appointments: true } },
    },
  });
  if (!professional) throw new NotFoundError("Profissional não encontrado.");

  const { services, _count, ...rest } = professional;
  return { ...rest, serviceIds: services.map((s) => s.serviceId), hasHistory: _count.appointments > 0 };
}
