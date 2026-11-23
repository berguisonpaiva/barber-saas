import { describe, expect, it } from "vitest";
import {
  calendarEvent,
  dayPill,
  monthTitle,
  nextSlotLabel,
  reservationCode,
  slotSummary,
  splitByPeriod,
  spokenDateTime,
  timeZoneLabel,
  windowLabel,
} from "@/components/booking/booking-labels";
import { LocalDay } from "@/shared/time/local-day";

const TZ = "America/Fortaleza";
const at = (iso: string) => new Date(`${iso}-03:00`);

describe("rótulos do fluxo de agendamento", () => {
  it("separa os horários em manhã e tarde pelo horário local", () => {
    const slots = [at("2026-11-20T09:00:00"), at("2026-11-20T11:30:00"), at("2026-11-20T12:00:00"), at("2026-11-20T18:00:00")];

    expect(splitByPeriod(slots, TZ)).toEqual({ morning: slots.slice(0, 2), afternoon: slots.slice(2) });
  });

  it.each([
    ["hoje", "2026-11-20T14:30:00", "hoje, 14:30"],
    ["amanhã", "2026-11-21T09:00:00", "amanhã, 09:00"],
    ["outro dia", "2026-11-24T09:00:00", "ter, 24/11, 09:00"],
  ])("próximo horário de %s", (_case, slot, expected) => {
    expect(nextSlotLabel(at(slot), at("2026-11-20T08:00:00"), TZ)).toBe(expected);
  });

  it("dia na faixa de datas: dia da semana e número", () => {
    expect(dayPill(LocalDay.parse("2026-11-22", TZ))).toEqual({ weekday: "DOM", day: "22" });
  });

  it("título do mês", () => expect(monthTitle(LocalDay.parse("2026-11-20", TZ))).toBe("Novembro 2026"));

  it("resumo do horário escolhido", () => {
    expect(slotSummary(at("2026-11-20T15:30:00"), TZ)).toBe("Sex, 20 nov · 15:30");
  });

  it("fuso com cidade e deslocamento", () => {
    expect(timeZoneLabel(TZ, at("2026-11-20T15:30:00"))).toBe("Fortaleza (UTC-3)");
  });

  it("data e hora por extenso", () => {
    expect(spokenDateTime(at("2026-11-20T15:30:00"), TZ)).toBe("sexta, 20 de nov às 15:30");
  });

  it.each([
    [120, "2 horas"],
    [60, "1 hora"],
    [90, "90 minutos"],
  ])("janela de %i minutos em palavras: %s", (minutes, expected) => {
    expect(windowLabel(minutes)).toBe(expected);
  });

  it("código da reserva a partir do id do agendamento", () => {
    expect(reservationCode("cebde53f-dc1e-4c50-a967-d37504cf532d")).toBe("#CEBD-E53F");
  });

  it("evento de calendário com início e fim em UTC e o local", () => {
    const ics = calendarEvent({
      id: "cebde53f-dc1e-4c50-a967-d37504cf532d",
      title: "Corte + Barba · Barbearia do João",
      startsAt: new Date("2026-11-20T18:30:00.000Z"),
      endsAt: new Date("2026-11-20T19:30:00.000Z"),
      location: "Rua das Flores, 120, Aldeota",
    });

    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20261120T183000Z");
    expect(ics).toContain("DTEND:20261120T193000Z");
    expect(ics).toContain("SUMMARY:Corte + Barba · Barbearia do João");
    expect(ics).toContain("LOCATION:Rua das Flores\\, 120\\, Aldeota");
    expect(ics.split("\r\n").length).toBeGreaterThan(5);
  });
});
