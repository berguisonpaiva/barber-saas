import { TZDate } from "@date-fns/tz";
import { LocalDay } from "@/shared/time/local-day";

export type AppointmentStatusName = "CONFIRMED" | "COMPLETED" | "CANCELED" | "NO_SHOW";

/** O mínimo de um agendamento que o Resumo precisa (preço e nomes vêm dos snapshots). */
export interface MetricAppointment {
  startsAt: Date;
  status: AppointmentStatusName;
  priceCents: number;
  /** Serviços do agendamento com o preço gravado de cada um; somados dão priceCents. */
  services: readonly { name: string; priceCents: number }[];
  professionalId: string;
  professionalName: string;
  customerId: string;
}

export interface PeriodTotals {
  /** Agendamentos que não foram cancelados (confirmados, atendidos e faltas). */
  booked: number;
  canceled: number;
  noShow: number;
  /** Confirmados + atendidos, pelo preço gravado no agendamento. Faltas e cancelados não entram. */
  revenueCents: number;
  averageTicketCents: number;
  /** Cancelados sobre todos os agendamentos do período (0–1). */
  cancellationRate: number;
  /** Faltas sobre os não cancelados (0–1). */
  noShowRate: number;
  customers: number;
}

export interface TimeBucket {
  /** Primeiro dia do grupo, "AAAA-MM-DD". */
  start: string;
  days: number;
  booked: number;
  revenueCents: number;
}

export interface RankedItem {
  key: string;
  label: string;
  value: number;
}

const isRevenue = (a: MetricAppointment) => a.status === "CONFIRMED" || a.status === "COMPLETED";
const isBooked = (a: MetricAppointment) => a.status !== "CANCELED";
const ratio = (part: number, whole: number) => (whole ? part / whole : 0);

export function periodTotals(appointments: MetricAppointment[]): PeriodTotals {
  const booked = appointments.filter(isBooked);
  const paying = appointments.filter(isRevenue);
  const revenueCents = paying.reduce((sum, a) => sum + a.priceCents, 0);
  const canceled = appointments.length - booked.length;
  const noShow = booked.filter((a) => a.status === "NO_SHOW").length;
  return {
    booked: booked.length,
    canceled,
    noShow,
    revenueCents,
    averageTicketCents: paying.length ? Math.round(revenueCents / paying.length) : 0,
    cancellationRate: ratio(canceled, appointments.length),
    noShowRate: ratio(noShow, booked.length),
    customers: new Set(booked.map((a) => a.customerId)).size,
  };
}

/** Variação relativa contra o período anterior; null quando não há base de comparação. */
export function relativeChange(current: number, previous: number): number | null {
  return previous ? (current - previous) / previous : null;
}

/**
 * Agrupa por dia local (fuso da barbearia) em grupos de `bucketDays` dias, a partir de `from`.
 * Dias sem agendamento aparecem com zero — a série não tem buracos.
 */
export function timeBuckets(
  appointments: MetricAppointment[],
  from: LocalDay,
  days: number,
  bucketDays: number,
): TimeBucket[] {
  const buckets: TimeBucket[] = [];
  const indexByDay = new Map<string, number>();
  for (let offset = 0; offset < days; offset += bucketDays) {
    const size = Math.min(bucketDays, days - offset);
    buckets.push({ start: from.addDays(offset).toString(), days: size, booked: 0, revenueCents: 0 });
    for (let d = 0; d < size; d++) indexByDay.set(from.addDays(offset + d).toString(), buckets.length - 1);
  }

  appointments.filter(isBooked).forEach((appointment) => {
    const index = indexByDay.get(LocalDay.of(appointment.startsAt, from.timeZone).toString());
    if (index === undefined) return;
    buckets[index].booked += 1;
    if (isRevenue(appointment)) buckets[index].revenueCents += appointment.priceCents;
  });
  return buckets;
}

/** Os `limit` maiores; o restante vira um único item "Outros" (nunca uma cor/linha a mais). */
function rank(totals: Map<string, RankedItem>, limit: number): RankedItem[] {
  const sorted = [...totals.values()].filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  if (sorted.length <= limit) return sorted;
  const rest = sorted.slice(limit - 1).reduce((sum, item) => sum + item.value, 0);
  return [...sorted.slice(0, limit - 1), { key: "outros", label: "Outros", value: rest }];
}

function accumulate<T>(entries: readonly T[], keyOf: (entry: T) => [string, string], valueOf: (entry: T) => number) {
  const totals = new Map<string, RankedItem>();
  entries.forEach((entry) => {
    const [key, label] = keyOf(entry);
    const item = totals.get(key) ?? { key, label, value: 0 };
    item.value += valueOf(entry);
    totals.set(key, item);
  });
  return totals;
}

/** Faturamento por serviço: um agendamento com vários serviços conta para cada um, pelo preço gravado de cada um. */
export function revenueByService(appointments: MetricAppointment[], limit = 5): RankedItem[] {
  const services = appointments.filter(isRevenue).flatMap((appointment) => appointment.services);
  const totals = accumulate(services, (service) => [service.name, service.name], (service) => service.priceCents);
  return rank(totals, limit);
}

/** Agendamentos (não cancelados) por profissional. */
export function bookingsByProfessional(appointments: MetricAppointment[], limit = 5): RankedItem[] {
  const totals = accumulate(appointments.filter(isBooked), (a) => [a.professionalId, a.professionalName], () => 1);
  return rank(totals, limit);
}

/** Agendamentos (não cancelados) por hora local de início; cobre da primeira à última hora com movimento. */
export function bookingsByHour(appointments: MetricAppointment[], timeZone: string): { hour: number; booked: number }[] {
  const counts = new Map<number, number>();
  appointments.filter(isBooked).forEach((appointment) => {
    const hour = new TZDate(appointment.startsAt.getTime(), timeZone).getHours();
    counts.set(hour, (counts.get(hour) ?? 0) + 1);
  });
  if (!counts.size) return [];
  const hours = [...counts.keys()];
  const first = Math.min(...hours);
  const last = Math.max(...hours);
  return Array.from({ length: last - first + 1 }, (_, i) => ({ hour: first + i, booked: counts.get(first + i) ?? 0 }));
}

export function statusCounts(appointments: MetricAppointment[]): Record<AppointmentStatusName, number> {
  const counts: Record<AppointmentStatusName, number> = { CONFIRMED: 0, COMPLETED: 0, NO_SHOW: 0, CANCELED: 0 };
  appointments.forEach((appointment) => (counts[appointment.status] += 1));
  return counts;
}
