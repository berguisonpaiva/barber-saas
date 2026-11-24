import "server-only";
import { prisma } from "@/shared/database/prisma";
import { ConflictError, NotFoundError } from "@/shared/errors/app-error";
import { isForeignKeyViolation } from "@/shared/database/errors";

const HAS_HISTORY = "Este serviço já tem agendamentos. Desative-o para preservar o histórico.";

/** RN-09: só exclui serviço sem nenhum agendamento; com histórico, o caminho é desativar. */
export async function deleteService(tenantId: string, serviceId: string) {
  const service = await prisma.service.findFirst({
    where: { tenantId, id: serviceId },
    select: { _count: { select: { appointments: true } } },
  });
  if (!service) throw new NotFoundError("Serviço não encontrado.");
  if (service._count.appointments > 0) throw new ConflictError(HAS_HISTORY, "HAS_HISTORY");

  try {
    await prisma.service.deleteMany({ where: { tenantId, id: serviceId } });
  } catch (error) {
    if (isForeignKeyViolation(error)) throw new ConflictError(HAS_HISTORY, "HAS_HISTORY");
    throw error;
  }
}
