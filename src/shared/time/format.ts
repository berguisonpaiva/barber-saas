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

/** Dia e mês: "20/11". */
export function dayMonth(instant: Date, timeZone: string): string {
  const t = local(instant, timeZone);
  return `${pad(t.getDate())}/${pad(t.getMonth() + 1)}`;
}
