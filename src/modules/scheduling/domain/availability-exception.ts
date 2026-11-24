import { ValidationError } from "@/shared/errors/app-error";
import type { LocalDay } from "@/shared/time/local-day";

export type ExceptionKind = "DAY_OFF" | "BLOCK";

export interface ExceptionRequest {
  type: ExceptionKind;
  day: LocalDay;
  today: LocalDay;
  startMinute?: number;
  endMinute?: number;
  reason?: string;
}

/** O que é gravado: trecho null = dia inteiro. */
export interface AvailabilityExceptionDraft {
  type: ExceptionKind;
  date: string;
  startMinute: number | null;
  endMinute: number | null;
  reason: string | null;
}

/**
 * Folga = dia inteiro, sem trecho. Bloqueio = trecho do dia (início < fim) ou, sem trecho, o dia inteiro.
 * Não se cria exceção para um dia que já passou no fuso da barbearia.
 */
export function draftAvailabilityException(request: ExceptionRequest): AvailabilityExceptionDraft {
  const { type, day, today, startMinute, endMinute } = request;
  if (today.isAfter(day)) throw new ValidationError("Escolha hoje ou uma data futura.");

  const hasStart = startMinute !== undefined;
  const hasEnd = endMinute !== undefined;
  if (hasStart !== hasEnd) throw new ValidationError("Informe o início e o fim do bloqueio.");

  const range = hasStart && hasEnd ? { start: startMinute, end: endMinute } : null;
  if (type === "DAY_OFF" && range) throw new ValidationError("Folga vale para o dia inteiro.");
  if (range && range.end <= range.start) throw new ValidationError("O fim precisa ser depois do início.");

  return {
    type,
    date: day.toString(),
    startMinute: range?.start ?? null,
    endMinute: range?.end ?? null,
    reason: request.reason ?? null,
  };
}
