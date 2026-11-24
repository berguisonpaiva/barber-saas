import "server-only";
import { prisma } from "@/shared/database/prisma";
import { LocalDay } from "@/shared/time/local-day";
import { systemClock, type Clock } from "@/shared/utils/clock";
import {
  bookingsByHour,
  bookingsByProfessional,
  periodTotals,
  relativeChange,
  revenueByService,
  statusCounts,
  timeBuckets,
  type MetricAppointment,
} from "../../domain/dashboard-metrics";

export const DASHBOARD_PERIODS = [7, 30, 90] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export function parseDashboardPeriod(value: unknown): DashboardPeriod {
  const days = Number(value);
  return DASHBOARD_PERIODS.find((period) => period === days) ?? 30;
}

/**
 * RF-15: indicadores dos últimos N dias (incluindo hoje, no fuso da barbearia)
 * comparados aos N dias anteriores. Uma consulta, agregação no domínio.
 */
export async function getDashboard(tenantId: string, days: DashboardPeriod, clock: Clock = systemClock) {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { timezone: true } });
  const timeZone = tenant.timezone;
  const today = LocalDay.today(clock, timeZone);
  const from = today.addDays(-(days - 1));
  const previousFrom = from.addDays(-days);
  const periodStart = from.at(0);

  const rows = await prisma.appointment.findMany({
    where: { tenantId, startsAt: { gte: previousFrom.at(0), lt: today.addDays(1).at(0) } },
    select: {
      startsAt: true,
      status: true,
      priceSnapshotCents: true,
      serviceNameSnapshot: true,
      customerId: true,
      professional: { select: { id: true, name: true } },
    },
  });

  const toMetric = (row: (typeof rows)[number]): MetricAppointment => ({
    startsAt: row.startsAt,
    status: row.status,
    priceCents: row.priceSnapshotCents,
    serviceName: row.serviceNameSnapshot,
    professionalId: row.professional.id,
    professionalName: row.professional.name,
    customerId: row.customerId,
  });
  const current = rows.filter((row) => row.startsAt >= periodStart).map(toMetric);
  const previous = rows.filter((row) => row.startsAt < periodStart).map(toMetric);

  const totals = periodTotals(current);
  const previousTotals = periodTotals(previous);

  return {
    days,
    timeZone,
    from: from.toString(),
    to: today.toString(),
    totals,
    changes: {
      revenue: relativeChange(totals.revenueCents, previousTotals.revenueCents),
      booked: relativeChange(totals.booked, previousTotals.booked),
      averageTicket: relativeChange(totals.averageTicketCents, previousTotals.averageTicketCents),
    },
    series: timeBuckets(current, from, days, days > 30 ? 7 : 1),
    byService: revenueByService(current),
    byProfessional: bookingsByProfessional(current),
    byHour: bookingsByHour(current, timeZone),
    statuses: statusCounts(current),
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;
