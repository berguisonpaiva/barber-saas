import { describe, expect, it } from "vitest";
import { clockTime, dayMonth, spokenTime } from "@/shared/time/format";

const FORTALEZA = "America/Fortaleza";

describe("formatos de hora e data no fuso da barbearia", () => {
  const afternoon = new Date("2026-11-20T18:30:00.000Z");

  it("hora de lista e grade: 15:30", () => expect(clockTime(afternoon, FORTALEZA)).toBe("15:30"));
  it("hora no texto corrido: 15h30", () => expect(spokenTime(afternoon, FORTALEZA)).toBe("15h30"));
  it("dia e mês: 20/11", () => expect(dayMonth(afternoon, FORTALEZA)).toBe("20/11"));

  it("usa o fuso, não UTC: 01h15 UTC de 21/11 ainda é 22h15 de 20/11 em Fortaleza", () => {
    const lateNight = new Date("2026-11-21T01:15:00.000Z");

    expect([clockTime(lateNight, FORTALEZA), spokenTime(lateNight, FORTALEZA), dayMonth(lateNight, FORTALEZA)]).toEqual([
      "22:15",
      "22h15",
      "20/11",
    ]);
  });
});
