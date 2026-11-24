import "server-only";
import { prisma } from "@/shared/database/prisma";
import { NotFoundError } from "@/shared/errors/app-error";

/** Desativado: não oferece horários nem aceita novos agendamentos; os confirmados continuam valendo. */
export async function setProfessionalActive(tenantId: string, professionalId: string, active: boolean) {
  const { count } = await prisma.professional.updateMany({ where: { tenantId, id: professionalId }, data: { active } });
  if (!count) throw new NotFoundError("Profissional não encontrado.");
}
