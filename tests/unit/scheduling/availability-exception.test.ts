import { describe, expect, it } from "vitest";
import { draftAvailabilityException } from "@/modules/scheduling/domain/availability-exception";
import { ValidationError } from "@/shared/errors/app-error";
import { LocalDay } from "@/shared/time/local-day";

const TZ = "America/Fortaleza";
const today = LocalDay.parse("2026-11-23", TZ);
const day = (date: string) => LocalDay.parse(date, TZ);

describe("folgas e bloqueios", () => {
  it("folga vale para o dia inteiro, sem trecho", () => {
    const draft = draftAvailabilityException({ type: "DAY_OFF", day: day("2026-11-25"), today, reason: "Viagem" });

    expect(draft).toEqual({ type: "DAY_OFF", date: "2026-11-25", startMinute: null, endMinute: null, reason: "Viagem" });
  });

  it("bloqueio guarda o trecho do dia", () => {
    const draft = draftAvailabilityException({ type: "BLOCK", day: day("2026-11-23"), today, startMinute: 840, endMinute: 960 });

    expect(draft).toMatchObject({ date: "2026-11-23", startMinute: 840, endMinute: 960, reason: null });
  });

  it("bloqueio sem trecho vale o dia inteiro", () => {
    const draft = draftAvailabilityException({ type: "BLOCK", day: day("2026-11-24"), today });

    expect(draft).toMatchObject({ startMinute: null, endMinute: null });
  });

  it("recusa data que já passou no fuso da barbearia", () => {
    expect(() => draftAvailabilityException({ type: "DAY_OFF", day: day("2026-11-22"), today })).toThrow(ValidationError);
  });

  it("recusa folga com trecho", () => {
    expect(() =>
      draftAvailabilityException({ type: "DAY_OFF", day: day("2026-11-24"), today, startMinute: 600, endMinute: 700 }),
    ).toThrow("Folga vale para o dia inteiro.");
  });

  it("recusa bloqueio só com início", () => {
    expect(() => draftAvailabilityException({ type: "BLOCK", day: day("2026-11-24"), today, startMinute: 600 })).toThrow(
      "Informe o início e o fim do bloqueio.",
    );
  });

  it("recusa bloqueio que termina antes de começar", () => {
    expect(() =>
      draftAvailabilityException({ type: "BLOCK", day: day("2026-11-24"), today, startMinute: 900, endMinute: 840 }),
    ).toThrow("O fim precisa ser depois do início.");
  });
});
