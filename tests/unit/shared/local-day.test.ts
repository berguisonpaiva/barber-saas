import { describe, expect, it } from "vitest";
import { LocalDay } from "@/shared/time/local-day";
import { ValidationError } from "@/shared/errors/app-error";

const FORTALEZA = "America/Fortaleza"; // UTC-3, sem horário de verão
const NEW_YORK = "America/New_York";
const HOUR = 60 * 60_000;

describe("dia no fuso da barbearia", () => {
  it("aceita uma data do calendário no formato AAAA-MM-DD", () => {
    expect(LocalDay.parse("2026-11-23", FORTALEZA).toString()).toBe("2026-11-23");
  });

  it.each(["2026-02-30", "2026-13-01", "23/11/2026", "2026-11-3"])("recusa %s como data inválida", (date) => {
    expect(() => LocalDay.parse(date, FORTALEZA)).toThrow(ValidationError);
  });

  it("o dia de um instante é o do fuso, não o de UTC", () => {
    expect(LocalDay.of(new Date("2026-11-24T02:30:00.000Z"), FORTALEZA).toString()).toBe("2026-11-23");
  });

  it("o dia vai da meia-noite local até a meia-noite local seguinte", () => {
    expect(LocalDay.parse("2026-11-23", FORTALEZA).utcRange()).toEqual({
      start: new Date("2026-11-23T03:00:00.000Z"),
      end: new Date("2026-11-24T03:00:00.000Z"),
    });
  });

  it.each([
    ["2026-03-08", 23],
    ["2026-11-01", 25],
  ])("em Nova York, %s dura %i horas por causa do horário de verão", (date, hours) => {
    const { start, end } = LocalDay.parse(date, NEW_YORK).utcRange();

    expect((end.getTime() - start.getTime()) / HOUR).toBe(hours);
  });

  it("um minuto do dia vira o instante UTC certo, com e sem horário de verão", () => {
    expect(LocalDay.parse("2026-07-01", NEW_YORK).at(9 * 60).toISOString()).toBe("2026-07-01T13:00:00.000Z");
    expect(LocalDay.parse("2026-12-01", NEW_YORK).at(9 * 60).toISOString()).toBe("2026-12-01T14:00:00.000Z");
  });

  it("somar dias atravessa fim de mês e de ano", () => {
    expect(LocalDay.parse("2026-11-30", FORTALEZA).addDays(1).toString()).toBe("2026-12-01");
    expect(LocalDay.parse("2026-12-31", FORTALEZA).addDays(1).toString()).toBe("2027-01-01");
  });

  it("compara dias pela ordem do calendário", () => {
    const monday = LocalDay.parse("2026-11-23", FORTALEZA);

    expect(monday.addDays(1).isAfter(monday)).toBe(true);
    expect(monday.isAfter(monday)).toBe(false);
  });

  it("sabe o dia da semana (0 = domingo)", () => {
    expect(LocalDay.parse("2026-11-23", FORTALEZA).weekday).toBe(1);
    expect(LocalDay.parse("2026-11-22", FORTALEZA).weekday).toBe(0);
  });

  it("hoje é o dia do fuso no instante do relógio, mesmo perto da meia-noite", () => {
    const clock = { now: () => new Date("2026-11-24T02:59:00.000Z") };

    expect(LocalDay.today(clock, FORTALEZA).toString()).toBe("2026-11-23");
  });
});
