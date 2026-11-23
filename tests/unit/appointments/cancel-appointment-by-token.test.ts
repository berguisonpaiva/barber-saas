import { describe, expect, it } from "vitest";
import { CancelAppointmentByToken } from "@/modules/appointments/application/use-cases/cancel-appointment-by-token";
import { CancellationWindowClosedError, InvalidCancelTokenError } from "@/modules/appointments/domain/errors";
import { InMemoryAppointmentStore, type NewStoredAppointment } from "../../support/in-memory-appointment-store";

const TENANT = "tenant-a";
const TOKEN = "link-de-cancelamento-do-carlos-123";
const STARTS_AT = new Date("2026-11-23T18:00:00.000Z");
const WITHIN_WINDOW = "2026-11-23T12:00:00.000Z";
const AFTER_WINDOW_CLOSED = "2026-11-23T16:30:00.000Z";

function setup(now: string) {
  const store = new InMemoryAppointmentStore();
  const cancel = new CancelAppointmentByToken(store, { now: () => new Date(now) });
  return { store, cancel };
}

function carlosAppointment(overrides: Partial<NewStoredAppointment> = {}): NewStoredAppointment {
  return {
    tenantId: TENANT,
    cancelToken: TOKEN,
    startsAt: STARTS_AT,
    customerName: "Carlos",
    serviceName: "Corte + Barba",
    professionalName: "Rafael",
    timeZone: "America/Fortaleza",
    cancellationWindowMinutes: 120,
    ...overrides,
  };
}

describe("cancelar pelo Link de cancelamento", () => {
  it("dentro da janela, cancela e avisa o proprietário de que o cliente cancelou", async () => {
    const { store, cancel } = setup("2026-11-23T12:00:00.000Z");
    const appointmentId = store.addAppointment({
      tenantId: TENANT,
      cancelToken: TOKEN,
      startsAt: STARTS_AT,
      customerName: "Carlos",
      serviceName: "Corte + Barba",
      professionalName: "Rafael",
      timeZone: "America/Fortaleza",
      cancellationWindowMinutes: 120,
    });

    const result = await cancel.execute({ tenantId: TENANT, token: TOKEN });

    expect(result).toEqual({ appointmentId, alreadyCanceled: false });
    expect(store.outbox).toEqual([
      {
        type: "appointment.canceled",
        payload: {
          appointmentId,
          customerName: "Carlos",
          serviceName: "Corte + Barba",
          professionalName: "Rafael",
          startsAt: "2026-11-23T18:00:00.000Z",
          timeZone: "America/Fortaleza",
          canceledBy: "CUSTOMER",
        },
      },
    ]);
  });

  it("exatamente no limite da janela, ainda cancela", async () => {
    const { cancel, store } = setup("2026-11-23T16:00:00.000Z");
    store.addAppointment(carlosAppointment());

    await expect(cancel.execute({ tenantId: TENANT, token: TOKEN })).resolves.toMatchObject({ alreadyCanceled: false });
  });

  it("com a janela fechada, recusa e não avisa ninguém", async () => {
    const { store, cancel } = setup(AFTER_WINDOW_CLOSED);
    store.addAppointment(carlosAppointment());

    await expect(cancel.execute({ tenantId: TENANT, token: TOKEN })).rejects.toThrow(CancellationWindowClosedError);
    expect(store.outbox).toEqual([]);
  });

  it("com um link desconhecido, recusa como link inválido", async () => {
    const { store, cancel } = setup(WITHIN_WINDOW);
    store.addAppointment(carlosAppointment());

    await expect(cancel.execute({ tenantId: TENANT, token: "outro-link-que-nao-existe-000" })).rejects.toThrow(
      InvalidCancelTokenError,
    );
  });

  it("com o link de outra barbearia, recusa como link inválido", async () => {
    const { store, cancel } = setup(WITHIN_WINDOW);
    store.addAppointment(carlosAppointment({ tenantId: "tenant-b" }));

    await expect(cancel.execute({ tenantId: TENANT, token: TOKEN })).rejects.toThrow(InvalidCancelTokenError);
  });

  it("cancelar de novo responde que já estava cancelado, sem avisar outra vez", async () => {
    const { store, cancel } = setup(WITHIN_WINDOW);
    const appointmentId = store.addAppointment(carlosAppointment());

    await cancel.execute({ tenantId: TENANT, token: TOKEN });
    const again = await cancel.execute({ tenantId: TENANT, token: TOKEN });

    expect(again).toEqual({ appointmentId, alreadyCanceled: true });
    expect(store.outbox).toHaveLength(1);
  });

  it("dois pedidos ao mesmo tempo cancelam uma vez só e nenhum dá erro", async () => {
    const { store, cancel } = setup(WITHIN_WINDOW);
    store.addAppointment(carlosAppointment());

    const results = await Promise.all([
      cancel.execute({ tenantId: TENANT, token: TOKEN }),
      cancel.execute({ tenantId: TENANT, token: TOKEN }),
    ]);

    expect(results.map((r) => r.alreadyCanceled).sort()).toEqual([false, true]);
    expect(store.outbox).toHaveLength(1);
  });

  it.each(["COMPLETED", "NO_SHOW"] as const)("agendamento %s não pode ser cancelado pelo link", async (status) => {
    const { store, cancel } = setup(WITHIN_WINDOW);
    store.addAppointment(carlosAppointment({ status }));

    await expect(cancel.execute({ tenantId: TENANT, token: TOKEN })).rejects.toThrow(InvalidCancelTokenError);
    expect(store.outbox).toEqual([]);
  });
});
