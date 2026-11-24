import { describe, expect, it } from "vitest";
import {
  bookingsByHour,
  bookingsByProfessional,
  periodTotals,
  relativeChange,
  revenueByService,
  statusCounts,
  timeBuckets,
  type MetricAppointment,
} from "@/modules/appointments/domain/dashboard-metrics";
import { LocalDay } from "@/shared/time/local-day";

const TZ = "America/Fortaleza"; // UTC−3, sem horário de verão

const appointment = (overrides: Partial<MetricAppointment> & { at: string }): MetricAppointment => ({
  startsAt: new Date(overrides.at),
  status: "CONFIRMED",
  priceCents: 4500,
  serviceName: "Corte",
  professionalId: "p1",
  professionalName: "Rafael",
  customerId: "c1",
  ...overrides,
});

describe("totais do período", () => {
  const sample = [
    appointment({ at: "2026-11-20T12:00:00Z", status: "COMPLETED", priceCents: 7000 }),
    appointment({ at: "2026-11-20T13:00:00Z", status: "CONFIRMED", priceCents: 4500, customerId: "c2" }),
    appointment({ at: "2026-11-21T13:00:00Z", status: "NO_SHOW", priceCents: 3500, customerId: "c3" }),
    appointment({ at: "2026-11-21T14:00:00Z", status: "CANCELED", priceCents: 4500, customerId: "c4" }),
  ];

  it("faturamento soma só confirmados e atendidos", () => {
    expect(periodTotals(sample).revenueCents).toBe(11_500);
  });

  it("ticket médio divide o faturamento pelos agendamentos que faturam", () => {
    expect(periodTotals(sample).averageTicketCents).toBe(5750);
  });

  it("agendamentos não contam cancelados; faltas contam", () => {
    expect(periodTotals(sample).booked).toBe(3);
  });

  it("taxa de cancelamento é sobre todos; taxa de faltas é sobre os não cancelados", () => {
    const totals = periodTotals(sample);

    expect(totals.cancellationRate).toBe(1 / 4);
    expect(totals.noShowRate).toBe(1 / 3);
  });

  it("clientes contam uma vez cada e ignoram quem só cancelou", () => {
    expect(periodTotals(sample).customers).toBe(3);
  });

  it("período vazio dá zeros, sem dividir por zero", () => {
    expect(periodTotals([])).toMatchObject({ revenueCents: 0, averageTicketCents: 0, cancellationRate: 0, noShowRate: 0 });
  });
});

describe("variação contra o período anterior", () => {
  it("é relativa ao anterior", () => {
    expect(relativeChange(150, 100)).toBe(0.5);
  });

  it("sem base anterior não há variação", () => {
    expect(relativeChange(10, 0)).toBeNull();
  });
});

describe("série por dia", () => {
  const from = LocalDay.parse("2026-11-20", TZ);

  it("agrupa pelo dia no fuso da barbearia, não pelo dia UTC", () => {
    const lateNight = appointment({ at: "2026-11-21T01:30:00Z" }); // 22h30 do dia 20 em Fortaleza

    const [first, second] = timeBuckets([lateNight], from, 2, 1);

    expect(first).toMatchObject({ start: "2026-11-20", booked: 1, revenueCents: 4500 });
    expect(second).toMatchObject({ start: "2026-11-21", booked: 0 });
  });

  it("dias sem movimento aparecem com zero e cancelados ficam de fora", () => {
    const buckets = timeBuckets([appointment({ at: "2026-11-20T12:00:00Z", status: "CANCELED" })], from, 3, 1);

    expect(buckets.map((b) => b.booked)).toEqual([0, 0, 0]);
  });

  it("agrupa em semanas com o último grupo parcial", () => {
    const buckets = timeBuckets([], from, 10, 7);

    expect(buckets.map((b) => [b.start, b.days])).toEqual([
      ["2026-11-20", 7],
      ["2026-11-27", 3],
    ]);
  });

  it("falta conta como agendamento mas não fatura", () => {
    const [bucket] = timeBuckets([appointment({ at: "2026-11-20T12:00:00Z", status: "NO_SHOW" })], from, 1, 1);

    expect(bucket).toMatchObject({ booked: 1, revenueCents: 0 });
  });
});

describe("rankings", () => {
  it("faturamento por serviço em ordem decrescente", () => {
    const ranked = revenueByService([
      appointment({ at: "2026-11-20T12:00:00Z", serviceName: "Barba", priceCents: 3500 }),
      appointment({ at: "2026-11-20T13:00:00Z", serviceName: "Corte", priceCents: 4500 }),
      appointment({ at: "2026-11-20T14:00:00Z", serviceName: "Barba", priceCents: 3500 }),
    ]);

    expect(ranked).toEqual([
      { key: "Barba", label: "Barba", value: 7000 },
      { key: "Corte", label: "Corte", value: 4500 },
    ]);
  });

  it("além do limite, o restante vira 'Outros'", () => {
    const many = ["A", "B", "C", "D"].map((name, i) =>
      appointment({ at: "2026-11-20T12:00:00Z", professionalId: name, professionalName: name, customerId: String(i) }),
    );

    const ranked = bookingsByProfessional([...many, many[0]], 3);

    expect(ranked).toEqual([
      { key: "A", label: "A", value: 2 },
      expect.objectContaining({ value: 1 }),
      { key: "outros", label: "Outros", value: 2 },
    ]);
  });
});

describe("horários de pico", () => {
  it("conta pela hora local e preenche as horas intermediárias com zero", () => {
    const byHour = bookingsByHour(
      [appointment({ at: "2026-11-20T12:00:00Z" }), appointment({ at: "2026-11-20T14:30:00Z" })],
      TZ,
    );

    expect(byHour).toEqual([
      { hour: 9, booked: 1 },
      { hour: 10, booked: 0 },
      { hour: 11, booked: 1 },
    ]);
  });

  it("sem agendamentos devolve lista vazia", () => {
    expect(bookingsByHour([], TZ)).toEqual([]);
  });
});

describe("situação", () => {
  it("conta cada status, inclusive os zerados", () => {
    expect(statusCounts([appointment({ at: "2026-11-20T12:00:00Z", status: "NO_SHOW" })])).toEqual({
      CONFIRMED: 0,
      COMPLETED: 0,
      NO_SHOW: 1,
      CANCELED: 0,
    });
  });
});
