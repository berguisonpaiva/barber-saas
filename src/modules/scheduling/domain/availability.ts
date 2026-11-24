import { LocalDay } from "@/shared/time/local-day";

/**
 * Motor de disponibilidade (PRD §9, RN-04). Função pura: sem banco, sem Next.
 *
 * Convenções:
 * - Janelas e bloqueios em minutos desde 00:00 no fuso da barbearia.
 * - Agendamentos ocupados e resultado em UTC (Date).
 * - Intervalos semiabertos [início, fim).
 */
export type MinuteRange = { start: number; end: number };
export type UtcInterval = { start: Date; end: Date };

export interface AvailabilityInput {
  /** Dia no fuso da barbearia. */
  day: LocalDay;
  /** Janelas de trabalho do profissional nesse dia da semana. */
  workingWindows: MinuteRange[];
  /** Bloqueios parciais da data (ex.: consulta médica 14:00–16:00). */
  blocks: MinuteRange[];
  /** Folga o dia inteiro. */
  dayOff: boolean;
  /** Agendamentos CONFIRMED do profissional que tocam o dia. */
  busy: UtcInterval[];
  durationMinutes: number;
  slotIntervalMinutes: number;
  now: Date;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
}

/** A grade anda pela duração do atendimento, arredondada para cima ao múltiplo da Grade de horários (60 min em grade de 30 → de hora em hora). */
export function slotStep(durationMinutes: number, slotIntervalMinutes: number): number {
  return Math.ceil(durationMinutes / slotIntervalMinutes) * slotIntervalMinutes;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Retorna os horários de início livres, em UTC, ordenados e sem duplicatas. */
export function computeAvailableSlots(input: AvailabilityInput): Date[] {
  const {
    day,
    workingWindows,
    blocks,
    dayOff,
    busy,
    durationMinutes,
    slotIntervalMinutes,
    now,
    minAdvanceMinutes,
    maxAdvanceDays,
  } = input;

  if (dayOff || durationMinutes <= 0 || slotIntervalMinutes <= 0) return [];
  if (day.isAfter(LocalDay.of(now, day.timeZone).addDays(maxAdvanceDays))) return [];

  const earliest = now.getTime() + minAdvanceMinutes * 60_000;
  const step = slotStep(durationMinutes, slotIntervalMinutes);

  const result = new Map<number, Date>();

  for (const window of workingWindows) {
    for (let start = window.start; start + durationMinutes <= window.end; start += step) {
      const end = start + durationMinutes;

      if (blocks.some((b) => overlaps(start, end, b.start, b.end))) continue;

      const startUtc = day.at(start);
      const endUtc = day.at(end);
      const s = startUtc.getTime();
      const e = endUtc.getTime();

      if (s < earliest) continue;
      if (busy.some((b) => overlaps(s, e, b.start.getTime(), b.end.getTime()))) continue;

      result.set(s, startUtc);
    }
  }

  return [...result.values()].sort((a, b) => a.getTime() - b.getTime());
}
