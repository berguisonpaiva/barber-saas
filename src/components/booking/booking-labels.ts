import { TZDate } from "@date-fns/tz";
import { clockTime } from "@/shared/time/format";
import { LocalDay } from "@/shared/time/local-day";

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const;
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const dayParts = (day: LocalDay) => {
  const [year, month, date] = day.toString().split("-").map(Number);
  return { year, month, date };
};

/** Manhã até 11:59; tarde a partir de 12:00 (horário local da barbearia). */
export function splitByPeriod(slots: readonly Date[], timeZone: string) {
  const isMorning = (slot: Date) => new TZDate(slot.getTime(), timeZone).getHours() < 12;
  return { morning: slots.filter(isMorning), afternoon: slots.filter((slot) => !isMorning(slot)) };
}

/** "hoje, 14:30" · "amanhã, 09:00" · "ter, 24/11, 09:00" */
export function nextSlotLabel(slot: Date, now: Date, timeZone: string): string {
  const day = LocalDay.of(slot, timeZone);
  const today = LocalDay.of(now, timeZone);
  const time = clockTime(slot, timeZone);
  if (day.toString() === today.toString()) return `hoje, ${time}`;
  if (day.toString() === today.addDays(1).toString()) return `amanhã, ${time}`;
  const { month, date } = dayParts(day);
  return `${WEEKDAYS[day.weekday]}, ${String(date).padStart(2, "0")}/${String(month).padStart(2, "0")}, ${time}`;
}

/** Pastilha da faixa de datas: { weekday: "DOM", day: "22" } */
export function dayPill(day: LocalDay) {
  return { weekday: WEEKDAYS[day.weekday].toUpperCase(), day: String(dayParts(day).date) };
}

/** "Novembro 2026" */
export function monthTitle(day: LocalDay): string {
  const { year, month } = dayParts(day);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** "Sex, 20 nov · 15:30" */
export function slotSummary(slot: Date, timeZone: string): string {
  const day = LocalDay.of(slot, timeZone);
  const { month, date } = dayParts(day);
  return `${capitalize(WEEKDAYS[day.weekday])}, ${date} ${MONTHS[month - 1]} · ${clockTime(slot, timeZone)}`;
}

const WEEKDAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"] as const;

/** "sexta, 20 de nov às 15:30" */
export function spokenDateTime(slot: Date, timeZone: string): string {
  const day = LocalDay.of(slot, timeZone);
  const { month, date } = dayParts(day);
  return `${WEEKDAY_NAMES[day.weekday]}, ${date} de ${MONTHS[month - 1]} às ${clockTime(slot, timeZone)}`;
}

/** Janela de cancelamento em palavras: "2 horas", "1 hora", "90 minutos". */
export function windowLabel(minutes: number): string {
  if (minutes % 60 !== 0) return `${minutes} minutos`;
  const hours = minutes / 60;
  return hours === 1 ? "1 hora" : `${hours} horas`;
}

/** "Fortaleza (UTC-3)" */
export function timeZoneLabel(timeZone: string, at: Date): string {
  const city = (timeZone.split("/").pop() ?? timeZone).replaceAll("_", " ");
  const offset = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")?.value;
  return `${city} (${(offset ?? "GMT").replace("GMT", "UTC")})`;
}

/** "#CEBD-E53F" — curto, para o cliente citar ao falar com a barbearia. */
export function reservationCode(appointmentId: string): string {
  const head = appointmentId.replaceAll("-", "").slice(0, 8).toUpperCase();
  return `#${head.slice(0, 4)}-${head.slice(4)}`;
}

const icsText = (text: string) => text.replace(/[\\;,]/g, (char) => `\\${char}`).replace(/\r?\n/g, "\\n");
const icsDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Arquivo .ics (RFC 5545) do agendamento, para "Adicionar ao calendário". */
export function calendarEvent(event: { id: string; title: string; startsAt: Date; endsAt: Date; location?: string | null }) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Barber SaaS//Agendamento//PT",
    "BEGIN:VEVENT",
    `UID:${event.id}@barbersaas`,
    `DTSTAMP:${icsDate(event.startsAt)}`,
    `DTSTART:${icsDate(event.startsAt)}`,
    `DTEND:${icsDate(event.endsAt)}`,
    `SUMMARY:${icsText(event.title)}`,
    ...(event.location ? [`LOCATION:${icsText(event.location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
