import { describe, expect, it } from "vitest";
import { validateWeeklySchedule, weeklyWorkingMinutes } from "@/modules/scheduling/domain/weekly-schedule";

const period = (weekday: number, start: string, end: string) => {
  const toMinutes = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3));
  return { weekday, startMinute: toMinutes(start), endMinute: toMinutes(end) };
};

describe("expediente semanal", () => {
  it("aceita dois períodos no mesmo dia com intervalo entre eles e devolve em ordem", () => {
    const result = validateWeeklySchedule([period(1, "13:00", "19:00"), period(1, "09:00", "12:00")]);

    expect(result).toEqual({ ok: true, periods: [period(1, "09:00", "12:00"), period(1, "13:00", "19:00")] });
  });

  it("aceita períodos encostados (fim de um = início do outro)", () => {
    expect(validateWeeklySchedule([period(2, "09:00", "12:00"), period(2, "12:00", "18:00")]).ok).toBe(true);
  });

  it("recusa períodos sobrepostos no mesmo dia", () => {
    const result = validateWeeklySchedule([period(3, "09:00", "13:00"), period(3, "12:00", "18:00")]);

    expect(result).toEqual({ ok: false, issues: [{ weekday: 3, message: "Há períodos sobrepostos neste dia." }] });
  });

  it("não considera sobreposição entre dias diferentes", () => {
    expect(validateWeeklySchedule([period(1, "09:00", "18:00"), period(2, "09:00", "18:00")]).ok).toBe(true);
  });

  it("recusa período que termina antes de começar", () => {
    const result = validateWeeklySchedule([period(4, "18:00", "09:00")]);

    expect(result.ok).toBe(false);
  });

  it("recusa dia da semana fora de 0–6", () => {
    expect(validateWeeklySchedule([period(7, "09:00", "10:00")]).ok).toBe(false);
  });

  it("expediente vazio (profissional sem atendimento) é válido", () => {
    expect(validateWeeklySchedule([])).toEqual({ ok: true, periods: [] });
  });

  it("soma os minutos de atendimento da semana", () => {
    expect(weeklyWorkingMinutes([period(1, "09:00", "12:00"), period(1, "13:00", "19:00")])).toBe(9 * 60);
  });
});
