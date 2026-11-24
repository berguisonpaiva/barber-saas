import "server-only";
import { prisma } from "@/shared/database/prisma";
import { NotFoundError } from "@/shared/errors/app-error";

/** Desativar retira o serviço da página pública sem apagar o histórico (RN-09). */
export async function setServiceActive(tenantId: string, serviceId: string, active: boolean) {
  const { count } = await prisma.service.updateMany({ where: { tenantId, id: serviceId }, data: { active } });
  if (!count) throw new NotFoundError("Serviço não encontrado.");
}
