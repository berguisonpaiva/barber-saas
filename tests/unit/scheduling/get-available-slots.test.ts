import { describe, expect, it } from "vitest";
import { GetAvailableSlots } from "@/modules/scheduling/application/use-cases/get-available-slots";
import type { MinuteRange } from "@/modules/scheduling/domain/availability";
import { NotFoundError, ValidationError } from "@/shared/errors/app-error";
import { InMemoryAppointmentStore } from "../../support/in-memory-appointment-store";

const TENANT = "tenant-a";
const TZ = "America/Fortaleza";
const RAFAEL = "prof-rafael";
const CORTE = "svc-corte";
const CORTE_E_BARBA = "svc-corte-barba";
const MONDAY = "2026-11-23";
const FRIDAY_9AM = "2026-11-20T12:00:00.000Z";
const h = (hhmm: string) => {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
};
const range = (from: string, to: string): MinuteRange => ({ start: h(from), end: h(to) });
const at = (hhmm: string, date = MONDAY) => new Date(`${date}T${hhmm}:00-03:00`);
const localTimes = (slots: Date[]) =>
  slots.map((s) => s.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }));

/** Exemplo do PRD §9: expediente 09h–12h com Intervalo 10h30–11h. */
const PRD_EXPEDIENTE = [range("09:00", "10:30"), range("11:00", "12:00")];

function setup({
  now = FRIDAY_9AM,
  maxAdvanceDays = 30,
  slotIntervalMinutes = 30,
  monday = PRD_EXPEDIENTE,
  tuesday = PRD_EXPEDIENTE,
} = {}) {
  const store = new InMemoryAppointmentStore();
  store.addBarbearia({
    tenantId: TENANT,
    timeZone: TZ,
    slotIntervalMinutes,
    minAdvanceMinutes: 120,
    maxAdvanceDays,
    cancellationWindowMinutes: 120,
  });
  store.addProfessional({ tenantId: TENANT, id: RAFAEL, name: "Rafael", weekly: { 1: monday, 2: tuesday } });
  store.addService({ tenantId: TENANT, id: CORTE, name: "Corte", priceCents: 4000, durationMinutes: 30, professionalIds: [RAFAEL] });
  store.addService({
    tenantId: TENANT,
    id: CORTE_E_BARBA,
    name: "Corte + Barba",
    priceCents: 7000,
    durationMinutes: 60,
    professionalIds: [RAFAEL],
  });

  const slots = new GetAvailableSlots(store, { now: () => new Date(now) });
  const freeTimes = async (date = MONDAY, serviceId = CORTE) =>
    localTimes((await slots.execute({ tenantId: TENANT, professionalId: RAFAEL, serviceId, date })).slots);
  const occupy = (from: string, to: string, status: "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELED" = "CONFIRMED") =>
    store.addAppointment({
      tenantId: TENANT,
      professionalId: RAFAEL,
      status,
      startsAt: at(from),
      endsAt: at(to),
      cancelToken: `link-${from}-${status}-0000000000`,
      customerName: "Cliente",
      serviceName: "Corte",
      professionalName: "Rafael",
      timeZone: TZ,
      cancellationWindowMinutes: 120,
    });
  return { store, slots, freeTimes, occupy };
}

describe("Horário livre", () => {
  it("reproduz o exemplo do PRD: Intervalo e um Confirmado às 09h30 ficam de fora", async () => {
    const { freeTimes, occupy } = setup();
    occupy("09:30", "10:00");

    expect(await freeTimes()).toEqual(["09:00", "10:00", "11:00", "11:30"]);
  });

  it("devolve os instantes em UTC (09:00 em Fortaleza = 12:00Z)", async () => {
    const { slots } = setup();

    const result = await slots.execute({ tenantId: TENANT, professionalId: RAFAEL, serviceId: CORTE, date: MONDAY });

    expect(result.slots[0].toISOString()).toBe("2026-11-23T12:00:00.000Z");
  });

  it("um serviço de 60 min não atravessa o Intervalo", async () => {
    const { freeTimes } = setup();

    expect(await freeTimes(MONDAY, CORTE_E_BARBA)).toEqual(["09:00", "09:30", "11:00"]);
  });

  it("um horário que termina quando um Confirmado começa não conflita com ele", async () => {
    const { freeTimes, occupy } = setup();
    occupy("10:00", "10:30");

    const times = await freeTimes();

    expect(times).toContain("09:30");
    expect(times).not.toContain("10:00");
  });

  it("a Grade de horários pode ser menor que a duração do serviço (de 15 em 15)", async () => {
    const { freeTimes } = setup({ slotIntervalMinutes: 15, monday: [range("09:00", "10:00")] });

    expect(await freeTimes()).toEqual(["09:00", "09:15", "09:30"]);
  });

  it("a Grade de horários começa no início de cada período do expediente", async () => {
    const { freeTimes } = setup({ monday: [range("13:15", "15:00")] });

    expect(await freeTimes()).toEqual(["13:15", "13:45", "14:15"]);
  });

  it("um Bloqueio parcial tira só os horários que encostam nele", async () => {
    const { store, freeTimes } = setup();
    store.addException({ tenantId: TENANT, professionalId: RAFAEL, date: MONDAY, type: "BLOCK", range: range("11:00", "12:00") });

    expect(await freeTimes()).toEqual(["09:00", "09:30", "10:00"]);
  });

  it("uma Folga zera o dia, mesmo que a exceção tenha um trecho", async () => {
    const { store, freeTimes } = setup();
    store.addException({ tenantId: TENANT, professionalId: RAFAEL, date: MONDAY, type: "DAY_OFF", range: range("09:00", "10:00") });

    expect(await freeTimes()).toEqual([]);
  });

  it("um Bloqueio sem trecho definido zera o dia", async () => {
    const { store, freeTimes } = setup();
    store.addException({ tenantId: TENANT, professionalId: RAFAEL, date: MONDAY, type: "BLOCK", range: null });

    expect(await freeTimes()).toEqual([]);
  });

  it.each(["COMPLETED", "NO_SHOW", "CANCELED"] as const)("um agendamento %s não ocupa o horário", async (status) => {
    const { freeTimes, occupy } = setup();
    occupy("09:00", "09:30", status);

    expect(await freeTimes()).toContain("09:00");
  });

  it("só o Confirmado ocupa o horário", async () => {
    const { freeTimes, occupy } = setup();
    occupy("09:00", "09:30", "CONFIRMED");

    expect(await freeTimes()).not.toContain("09:00");
  });

  it.each([
    ["profissional desativado", { professionalActive: false, serviceActive: true }],
    ["serviço desativado", { professionalActive: true, serviceActive: false }],
  ])("com %s, responde serviço indisponível", async (_case, { professionalActive, serviceActive }) => {
    const { store, slots } = setup();
    store.addProfessional({ tenantId: TENANT, id: "prof-bruno", name: "Bruno", weekly: { 1: PRD_EXPEDIENTE }, active: professionalActive });
    store.addService({
      tenantId: TENANT,
      id: "svc-sobrancelha",
      name: "Sobrancelha",
      priceCents: 2000,
      durationMinutes: 30,
      professionalIds: ["prof-bruno"],
      active: serviceActive,
    });

    await expect(
      slots.execute({ tenantId: TENANT, professionalId: "prof-bruno", serviceId: "svc-sobrancelha", date: MONDAY }),
    ).rejects.toThrow(NotFoundError);
  });

  it("um profissional que não executa o serviço responde serviço indisponível", async () => {
    const { store, slots } = setup();
    store.addProfessional({ tenantId: TENANT, id: "prof-bruno", name: "Bruno", weekly: { 1: PRD_EXPEDIENTE } });

    await expect(
      slots.execute({ tenantId: TENANT, professionalId: "prof-bruno", serviceId: CORTE, date: MONDAY }),
    ).rejects.toThrow(NotFoundError);
  });

  it("respeita a Antecedência mínima", async () => {
    const { freeTimes } = setup({ now: "2026-11-23T11:00:00.000Z" });

    expect(await freeTimes()).toEqual(["10:00", "11:00", "11:30"]);
  });

  it("uma data que não existe no calendário é recusada como dado inválido", async () => {
    const { slots } = setup();

    await expect(
      slots.execute({ tenantId: TENANT, professionalId: RAFAEL, serviceId: CORTE, date: "2026-02-30" }),
    ).rejects.toThrow(ValidationError);
  });

  it("o último dia do Limite de dias aparece inteiro, e o seguinte não aparece", async () => {
    const { freeTimes } = setup({ maxAdvanceDays: 3 });

    expect(await freeTimes(MONDAY)).toEqual(["09:00", "09:30", "10:00", "11:00", "11:30"]);
    expect(await freeTimes("2026-11-24")).toEqual([]);
  });
});
