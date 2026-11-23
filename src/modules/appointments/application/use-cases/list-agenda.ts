import "server-only";
import { prisma } from "@/shared/database/prisma";
import { LocalDay } from "@/shared/time/local-day";
import { systemClock, type Clock } from "@/shared/utils/clock";

/** RF-11: agenda do dia (fuso da barbearia). Sempre filtrada pelo tenant da sessão. */
export async function listAgenda(tenantId: string, date?: string, clock: Clock = systemClock) {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { timezone: true } });
  const day = date ? LocalDay.parse(date, tenant.timezone) : LocalDay.today(clock, tenant.timezone);
  const { start: from, end: to } = day.utcRange();

  const appointments = await prisma.appointment.findMany({
    where: { tenantId, startsAt: { gte: from, lt: to } },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      priceSnapshotCents: true,
      serviceNameSnapshot: true,
      durationSnapshotMinute: true,
      customerNameSnapshot: true,
      professional: { select: { name: true } },
    },
  });

  return { date: day.toString(), timeZone: tenant.timezone, appointments };
}
