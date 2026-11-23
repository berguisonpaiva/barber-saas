import { describe, expect, it } from "vitest";
import { FindNextFreeSlot } from "@/modules/scheduling/application/use-cases/find-next-free-slot";
import { GetAvailableSlots } from "@/modules/scheduling/application/use-cases/get-available-slots";
import { InMemoryAppointmentStore } from "../../support/in-memory-appointment-store";

const TENANT = "tenant-a";
const TZ = "America/Fortaleza";
const RAFAEL = "prof-rafael";
const CORTE = "svc-corte";
const MORNING = [{ start: 9 * 60, end: 12 * 60 }];
const MONDAY_8AM = "2026-11-23T11:00:00.000Z";

function setup({ now = MONDAY_8AM, maxAdvanceDays = 30, weekly = { 1: MORNING, 2: MORNING } as Record<number, typeof MORNING> } = {}) {
  const store = new InMemoryAppointmentStore();
  store.addBarbearia({ tenantId: TENANT, timeZone: TZ, slotIntervalMinutes: 30, minAdvanceMinutes: 120, maxAdvanceDays, cancellationWindowMinutes: 120 });
  store.addProfessional({ tenantId: TENANT, id: RAFAEL, name: "Rafael", weekly });
  store.addService({ tenantId: TENANT, id: CORTE, name: "Corte", priceCents: 4000, durationMinutes: 30, professionalIds: [RAFAEL] });
  const clock = { now: () => new Date(now) };
  const next = new FindNextFreeSlot(new GetAvailableSlots(store, clock), store, clock);
  return { store, next: () => next.execute({ tenantId: TENANT, professionalId: RAFAEL, serviceId: CORTE }) };
}

describe("próximo horário livre do profissional", () => {
  it("é o primeiro horário livre de hoje, respeitando a antecedência mínima", async () => {
    const { next } = setup();

    expect(await next()).toEqual(new Date("2026-11-23T10:00:00-03:00"));
  });

  it("pula um dia de Folga e acha o primeiro horário do dia seguinte", async () => {
    const { store, next } = setup();
    store.addException({ tenantId: TENANT, professionalId: RAFAEL, date: "2026-11-23", type: "DAY_OFF", range: null });

    expect(await next()).toEqual(new Date("2026-11-24T09:00:00-03:00"));
  });

  it("não acha nada além do Limite de dias", async () => {
    const { next } = setup({ maxAdvanceDays: 3, weekly: { 5: MORNING } });

    expect(await next()).toBeNull();
  });
});
