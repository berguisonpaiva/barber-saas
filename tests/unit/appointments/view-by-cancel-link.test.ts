import { describe, expect, it } from "vitest";
import { ViewAppointmentByCancelLink } from "@/modules/appointments/application/use-cases/view-appointment-by-cancel-link";
import { CancelAppointmentByToken } from "@/modules/appointments/application/use-cases/cancel-appointment-by-token";
import { InMemoryAppointmentStore, type NewStoredAppointment } from "../../support/in-memory-appointment-store";

const TENANT = "tenant-a";
const TOKEN = "link-de-cancelamento-do-carlos-123";
const STARTS_AT = new Date("2026-11-20T18:30:00.000Z");

function setup(now = "2026-11-20T12:00:00.000Z") {
  const store = new InMemoryAppointmentStore();
  const clock = { now: () => new Date(now) };
  const view = new ViewAppointmentByCancelLink(store, clock);
  const cancel = new CancelAppointmentByToken(store, clock);
  return { store, view: (token = TOKEN) => view.execute({ tenantId: TENANT, token }), cancel };
}

const carlos = (overrides: Partial<NewStoredAppointment> = {}): NewStoredAppointment => ({
  tenantId: TENANT,
  cancelToken: TOKEN,
  startsAt: STARTS_AT,
  customerName: "Carlos",
  serviceName: "Corte + Barba",
  professionalName: "Rafael Lima",
  timeZone: "America/Fortaleza",
  cancellationWindowMinutes: 120,
  ...overrides,
});

describe("ver o agendamento pelo Link de cancelamento", () => {
  it("dentro da janela, mostra os dados e permite cancelar", async () => {
    const { store, view } = setup();
    const appointmentId = store.addAppointment(carlos());

    expect(await view()).toEqual({
      appointmentId,
      customerName: "Carlos",
      serviceName: "Corte + Barba",
      professionalName: "Rafael Lima",
      startsAt: STARTS_AT,
      timeZone: "America/Fortaleza",
      cancellationWindowMinutes: 120,
      state: "cancellable",
    });
  });

  it("com a janela fechada, mostra os dados mas não permite cancelar", async () => {
    const { store, view } = setup("2026-11-20T17:00:00.000Z");
    store.addAppointment(carlos());

    expect(await view()).toMatchObject({ state: "window-closed" });
  });

  it("depois de cancelado, mostra que já foi cancelado", async () => {
    const { store, view, cancel } = setup();
    store.addAppointment(carlos());
    await cancel.execute({ tenantId: TENANT, token: TOKEN });

    expect(await view()).toMatchObject({ state: "canceled" });
  });

  it.each([
    ["link desconhecido", "outro-link-que-nao-existe-000", {}],
    ["agendamento já atendido", TOKEN, { status: "COMPLETED" as const }],
    ["link de outra barbearia", TOKEN, { tenantId: "tenant-b" }],
  ])("%s é tratado como link inválido", async (_case, token, overrides) => {
    const { store, view } = setup();
    store.addAppointment(carlos(overrides));

    expect(await view(token)).toBeNull();
  });
});
