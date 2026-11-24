import "server-only";
import { prisma } from "@/shared/database/prisma";
import { NotFoundError } from "@/shared/errors/app-error";

/** Serviço da barbearia para o formulário de edição; inclui se já tem histórico (RN-09). */
export async function getServiceForEdit(tenantId: string, serviceId: string) {
  const service = await prisma.service.findFirst({
    where: { tenantId, id: serviceId },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      durationMinutes: true,
      active: true,
      professionals: { select: { professionalId: true } },
      _count: { select: { appointments: true } },
    },
  });
  if (!service) throw new NotFoundError("Serviço não encontrado.");

  const { professionals, _count, ...rest } = service;
  return { ...rest, professionalIds: professionals.map((p) => p.professionalId), hasHistory: _count.appointments > 0 };
}
