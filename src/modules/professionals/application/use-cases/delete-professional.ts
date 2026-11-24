import "server-only";
import { prisma } from "@/shared/database/prisma";
import { isForeignKeyViolation } from "@/shared/database/errors";
import { ConflictError, NotFoundError } from "@/shared/errors/app-error";

const HAS_HISTORY = "Este profissional já tem agendamentos. Desative-o para preservar o histórico.";

/** RN-09: só exclui profissional sem agendamentos; expediente, folgas e vínculos saem em cascata. */
export async function deleteProfessional(tenantId: string, professionalId: string) {
  const professional = await prisma.professional.findFirst({
    where: { tenantId, id: professionalId },
    select: { _count: { select: { appointments: true } } },
  });
  if (!professional) throw new NotFoundError("Profissional não encontrado.");
  if (professional._count.appointments > 0) throw new ConflictError(HAS_HISTORY, "HAS_HISTORY");

  try {
    await prisma.professional.deleteMany({ where: { tenantId, id: professionalId } });
  } catch (error) {
    if (isForeignKeyViolation(error)) throw new ConflictError(HAS_HISTORY, "HAS_HISTORY");
    throw error;
  }
}
