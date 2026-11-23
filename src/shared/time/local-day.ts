import { TZDate } from "@date-fns/tz";
import { ValidationError } from "@/shared/errors/app-error";
import type { Clock } from "@/shared/utils/clock";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad = (n: number) => String(n).padStart(2, "0");

/** Um dia do calendário no fuso da barbearia. Imutável; só existe para datas reais. */
export class LocalDay {
  private constructor(
    private readonly year: number,
    private readonly month: number,
    private readonly day: number,
    readonly timeZone: string,
  ) {}

  /** "AAAA-MM-DD"; datas inexistentes (ex.: 30/02) são recusadas. */
  static parse(date: string, timeZone: string): LocalDay {
    const match = DATE_RE.exec(date);
    if (!match) throw new ValidationError("Data inválida. Use AAAA-MM-DD.");
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const probe = new Date(Date.UTC(year, month - 1, day));
    if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
      throw new ValidationError("Data inválida. Use AAAA-MM-DD.");
    }
    return new LocalDay(year, month, day, timeZone);
  }

  static of(instant: Date, timeZone: string): LocalDay {
    const local = new TZDate(instant.getTime(), timeZone);
    return new LocalDay(local.getFullYear(), local.getMonth() + 1, local.getDate(), timeZone);
  }

  static today(clock: Clock, timeZone: string): LocalDay {
    return LocalDay.of(clock.now(), timeZone);
  }

  /** 0 = domingo … 6 = sábado. */
  get weekday(): number {
    return new TZDate(this.year, this.month - 1, this.day, 12, 0, 0, this.timeZone).getDay();
  }

  addDays(days: number): LocalDay {
    const shifted = new Date(Date.UTC(this.year, this.month - 1, this.day + days));
    return new LocalDay(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate(), this.timeZone);
  }

  isAfter(other: LocalDay): boolean {
    return this.toString() > other.toString();
  }

  /** Instante UTC de um minuto local deste dia (minutos desde 00:00). */
  at(minuteOfDay: number): Date {
    const hours = Math.floor(minuteOfDay / 60);
    const minutes = minuteOfDay % 60;
    return new Date(new TZDate(this.year, this.month - 1, this.day, hours, minutes, 0, this.timeZone).getTime());
  }

  /** Da meia-noite local deste dia até a meia-noite local do dia seguinte (23 h ou 25 h no horário de verão). */
  utcRange(): { start: Date; end: Date } {
    return { start: this.at(0), end: this.addDays(1).at(0) };
  }

  toString(): string {
    return `${this.year}-${pad(this.month)}-${pad(this.day)}`;
  }
}
