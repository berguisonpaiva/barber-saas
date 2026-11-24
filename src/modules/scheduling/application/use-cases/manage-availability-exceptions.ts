import "server-only";
import { prisma } from "@/shared/database/prisma";
import { NotFoundError } from "@/shared/errors/app-error";
import { LocalDay } from "@/shared/time/local-day";
import { systemClock, type Clock } from "@/shared/utils/clock";
import { draftAvailabilityException } from "../../domain/availability-exception";
import type { AvailabilityExceptionInput } from "../../presentation/schemas/availability";

/** Coluna @db.Date: a data local é gravada como meia-noite UTC (mesma convenção do repositório de horários). */
const toDbDate = (date: string) => new Date(`${date}T00:00:00.000Z`);
const fromDbDate = (date: Date) => date.toISOString().slice(0, 10);

async function tenantContext(tenantId: string, professionalId: string) {
  const professional = await prisma.professional.findFirst({
    where: { tenantId, id: professionalId },
    select: { tenant: { select: { timezone: true } } },
  });
  if (!professional) throw new NotFoundError("Profissional não encontrado.");
  return { timeZone: professional.tenant.timezone };
}

/** RF-07: folgas e bloqueios de hoje em diante, no fuso da barbearia. */
export async function listUpcomingExceptions(tenantId: string, professionalId: string, clock: Clock = systemClock) {
  const { timeZone } = await tenantContext(tenantId, professionalId);
  const today = LocalDay.today(clock, timeZone);
  const exceptions = await prisma.availabilityException.findMany({
    where: { tenantId, professionalId, date: { gte: toDbDate(today.toString()) } },
    orderBy: [{ date: "asc" }, { startMinute: "asc" }],
    select: { id: true, date: true, type: true, startMinute: true, endMinute: true, reason: true },
  });
  return { today: today.toString(), exceptions: exceptions.map((e) => ({ ...e, date: fromDbDate(e.date) })) };
}

export async function createAvailabilityException(
  tenantId: string,
  professionalId: string,
  input: AvailabilityExceptionInput,
  clock: Clock = systemClock,
) {
  const { timeZone } = await tenantContext(tenantId, professionalId);
  const draft = draftAvailabilityException({
    type: input.type,
    day: LocalDay.parse(input.date, timeZone),
    today: LocalDay.today(clock, timeZone),
    startMinute: input.start,
    endMinute: input.end,
    reason: input.reason,
  });
  await prisma.availabilityException.create({
    data: { tenantId, professionalId, ...draft, date: toDbDate(draft.date) },
  });
}

export async function deleteAvailabilityException(tenantId: string, exceptionId: string) {
  const { count } = await prisma.availabilityException.deleteMany({ where: { tenantId, id: exceptionId } });
  if (!count) throw new NotFoundError("Folga ou bloqueio não encontrado.");
}
