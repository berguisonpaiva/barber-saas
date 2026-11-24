import "server-only";
import { prisma } from "@/shared/database/prisma";
import { NotFoundError, ValidationError } from "@/shared/errors/app-error";
import { WEEKDAY_LONG } from "@/shared/time/format";
import { validateWeeklySchedule, type WorkingPeriod } from "../../domain/weekly-schedule";

async function assertProfessional(tenantId: string, professionalId: string) {
  const found = await prisma.professional.count({ where: { tenantId, id: professionalId } });
  if (!found) throw new NotFoundError("Profissional não encontrado.");
}

/** RF-06: expediente semanal do profissional, ordenado por dia e início. */
export async function getWeeklySchedule(tenantId: string, professionalId: string): Promise<WorkingPeriod[]> {
  await assertProfessional(tenantId, professionalId);
  return prisma.availabilityRule.findMany({
    where: { tenantId, professionalId },
    orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
    select: { weekday: true, startMinute: true, endMinute: true },
  });
}

/**
 * RF-06: substitui o expediente inteiro numa transação.
 * Agendamentos já confirmados não são alterados; o novo expediente vale para os próximos horários livres.
 */
export async function replaceWeeklySchedule(tenantId: string, professionalId: string, periods: WorkingPeriod[]) {
  const validation = validateWeeklySchedule(periods);
  if (!validation.ok) {
    const [first] = validation.issues;
    throw new ValidationError(`${WEEKDAY_LONG[first.weekday] ?? "Expediente"}: ${first.message}`, validation.issues);
  }

  await assertProfessional(tenantId, professionalId);
  await prisma.$transaction([
    prisma.availabilityRule.deleteMany({ where: { tenantId, professionalId } }),
    prisma.availabilityRule.createMany({
      data: validation.periods.map((period) => ({ tenantId, professionalId, ...period })),
    }),
  ]);
}
