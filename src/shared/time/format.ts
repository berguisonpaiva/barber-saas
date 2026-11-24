import { TZDate } from "@date-fns/tz";

const pad = (n: number) => String(n).padStart(2, "0");
const local = (instant: Date, timeZone: string) => new TZDate(instant.getTime(), timeZone);

/** Hora para listas e grades: "15:30". */
export function clockTime(instant: Date, timeZone: string): string {
  const t = local(instant, timeZone);
  return `${pad(t.getHours())}:${pad(t.getMinutes())}`;
}

/** Hora no texto corrido: "15h30". */
export function spokenTime(instant: Date, timeZone: string): string {
  const t = local(instant, timeZone);
  return `${pad(t.getHours())}h${pad(t.getMinutes())}`;
}

/** Minutos desde 00:00 → "09:30" (expediente, bloqueios). */
export function minutesToClock(minuteOfDay: number): string {
  return `${pad(Math.floor(minuteOfDay / 60))}:${pad(minuteOfDay % 60)}`;
}

/** 0 = domingo … 6 = sábado; a semana do painel começa na segunda. */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
export const WEEKDAY_LONG = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;

/** Dia e mês: "20/11". */
export function dayMonth(instant: Date, timeZone: string): string {
  const t = local(instant, timeZone);
  return `${pad(t.getDate())}/${pad(t.getMonth() + 1)}`;
}
