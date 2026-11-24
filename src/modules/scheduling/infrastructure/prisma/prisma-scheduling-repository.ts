import "server-only";
import { prisma } from "@/shared/database/prisma";
import type { DayFacts, OfferFacts } from "../../domain/day-facts";
import type { SchedulingRepository, SchedulingSettings } from "../../application/ports/scheduling-repository";

export class PrismaSchedulingRepository implements SchedulingRepository {
  async getSettings(tenantId: string): Promise<SchedulingSettings | null> {
    return prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { timezone: true, slotIntervalMinutes: true, minAdvanceMinutes: true, maxAdvanceDays: true },
    }).then((t) =>
      t
        ? {
            timeZone: t.timezone,
            slotIntervalMinutes: t.slotIntervalMinutes,
            minAdvanceMinutes: t.minAdvanceMinutes,
            maxAdvanceDays: t.maxAdvanceDays,
          }
        : null,
    );
  }

  async findOffer(tenantId: string, professionalId: string, serviceIds: readonly string[]): Promise<OfferFacts | null> {
    const [professional, links] = await Promise.all([
      prisma.professional.findFirst({ where: { tenantId, id: professionalId }, select: { name: true, active: true } }),
      prisma.professionalService.findMany({
        where: { tenantId, professionalId, serviceId: { in: [...serviceIds] } },
        select: { service: { select: { id: true, name: true, priceCents: true, durationMinutes: true, active: true } } },
      }),
    ]);
    const byId = new Map(links.map(({ service }) => [service.id, service]));
    const services = serviceIds.flatMap((id) => byId.get(id) ?? []);
    if (!professional || services.length !== serviceIds.length) return null;
    return { services, professional };
  }

  async getDayFacts(params: {
    tenantId: string;
    professionalId: string;
    date: string;
    weekday: number;
    dayStartUtc: Date;
    dayEndUtc: Date;
  }): Promise<DayFacts> {
    const { tenantId, professionalId, date, weekday, dayStartUtc, dayEndUtc } = params;

    const [rules, exceptions, appointments] = await Promise.all([
      prisma.availabilityRule.findMany({
        where: { tenantId, professionalId, weekday },
        select: { startMinute: true, endMinute: true },
      }),
      prisma.availabilityException.findMany({
        where: { tenantId, professionalId, date: new Date(`${date}T00:00:00.000Z`) },
        select: { type: true, startMinute: true, endMinute: true },
      }),
      prisma.appointment.findMany({
        where: { tenantId, professionalId, startsAt: { lt: dayEndUtc }, endsAt: { gt: dayStartUtc } },
        select: { status: true, startsAt: true, endsAt: true },
      }),
    ]);

    return {
      workingPeriods: rules.map((r) => ({ start: r.startMinute, end: r.endMinute })),
      exceptions: exceptions.map((e) => ({
        type: e.type,
        range: e.startMinute !== null && e.endMinute !== null ? { start: e.startMinute, end: e.endMinute } : null,
      })),
      appointments: appointments.map((a) => ({ status: a.status, start: a.startsAt, end: a.endsAt })),
    };
  }
}
