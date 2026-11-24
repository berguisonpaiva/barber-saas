import { occupiesProfessionalTime, type AppointmentStatus } from "@/modules/appointments/domain/appointment";
import type { MinuteRange, UtcInterval } from "./availability";

export interface AvailabilityExceptionFact {
  type: "DAY_OFF" | "BLOCK";
  range: MinuteRange | null;
}

export interface AppointmentFact {
  status: AppointmentStatus;
  start: Date;
  end: Date;
}

/** O que existe registrado para um profissional num dia, sem nenhuma regra aplicada. */
export interface DayFacts {
  workingPeriods: MinuteRange[];
  exceptions: AvailabilityExceptionFact[];
  appointments: AppointmentFact[];
}

export interface DaySchedule {
  workingWindows: MinuteRange[];
  blocks: MinuteRange[];
  dayOff: boolean;
  busy: UtcInterval[];
}

export interface OfferFacts {
  services: { id: string; name: string; priceCents: number; durationMinutes: number; active: boolean }[];
  professional: { name: string; active: boolean };
}

/** RN-04: Folga ou Bloqueio sem trecho zeram o dia; só o que ocupa o profissional conta como ocupado. */
export function scheduleOf(facts: DayFacts): DaySchedule {
  const dayOff = facts.exceptions.some((e) => e.type === "DAY_OFF" || e.range === null);
  const blocks = facts.exceptions.flatMap((e) => (e.type === "BLOCK" && e.range ? [e.range] : []));
  const busy = facts.appointments
    .filter((a) => occupiesProfessionalTime(a.status))
    .map(({ start, end }) => ({ start, end }));
  return { workingWindows: facts.workingPeriods, blocks, dayOff, busy };
}

/** Profissional Desativado, ou qualquer serviço escolhido Desativado, não oferece horários. */
export function isBookable(offer: OfferFacts): boolean {
  return offer.professional.active && offer.services.every((service) => service.active);
}
