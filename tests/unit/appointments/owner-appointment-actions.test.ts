import { describe, expect, it } from "vitest";
import { CancelAppointmentByOwner } from "@/modules/appointments/application/use-cases/cancel-appointment-by-owner";
import { RecordAttendance } from "@/modules/appointments/application/use-cases/record-attendance";
import { ownerActionsFor } from "@/modules/appointments/domain/appointment";
import {
  AppointmentClosedError,
  AppointmentNotFoundError,
  AttendanceTooEarlyError,
} from "@/modules/appointments/domain/errors";
import { InMemoryAppointmentStore } from "../../support/in-memory-appointment-store";

const TENANT = "tenant-a";
const STARTS_AT = new Date("2026-11-23T18:00:00.000Z");
const BEFORE_START = new Date("2026-11-23T17:00:00.000Z");
const AFTER_START = new Date("2026-11-23T18:40:00.000Z");

function setup(now: Date, status: "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELED" = "CONFIRMED") {
  const store = new InMemoryAppointmentStore();
  const clock = { now: () => now };
  const id = store.addAppointment({
    tenantId: TENANT,
    cancelToken: "token-qualquer",
    status,
    startsAt: STARTS_AT,
    customerName: "Carlos",
    serviceName: "Corte",
    professionalName: "Rafael",
    timeZone: "America/Fortaleza",
    cancellationWindowMinutes: 120,
  });
  return { store, id, attendance: new RecordAttendance(store, clock), cancel: new CancelAppointmentByOwner(store, clock) };
}

describe("ações do proprietário disponíveis", () => {
  it("antes do início só dá para cancelar", () => {
    expect(ownerActionsFor("CONFIRMED", STARTS_AT, BEFORE_START)).toEqual({ canRecordAttendance: false, canCancel: true });
  });

  it("depois do início dá para marcar e ainda cancelar", () => {
    expect(ownerActionsFor("CONFIRMED", STARTS_AT, AFTER_START)).toEqual({ canRecordAttendance: true, canCancel: true });
  });

  it("atendido pode ser corrigido para faltou, mas não cancelado", () => {
    expect(ownerActionsFor("COMPLETED", STARTS_AT, AFTER_START)).toEqual({ canRecordAttendance: true, canCancel: false });
  });

  it("cancelado não oferece nada", () => {
    expect(ownerActionsFor("CANCELED", STARTS_AT, AFTER_START)).toEqual({ canRecordAttendance: false, canCancel: false });
  });
});

describe("marcar Atendido ou Faltou", () => {
  it("depois do início, marca o confirmado como atendido", async () => {
    const { store, id, attendance } = setup(AFTER_START);

    await attendance.execute({ tenantId: TENANT, appointmentId: id, outcome: "COMPLETED" });

    expect(store.statusOf(id)).toBe("COMPLETED");
  });

  it("corrige atendido para faltou", async () => {
    const { store, id, attendance } = setup(AFTER_START, "COMPLETED");

    await attendance.execute({ tenantId: TENANT, appointmentId: id, outcome: "NO_SHOW" });

    expect(store.statusOf(id)).toBe("NO_SHOW");
  });

  it("antes do horário marcado é recusado", async () => {
    const { store, id, attendance } = setup(BEFORE_START);

    await expect(attendance.execute({ tenantId: TENANT, appointmentId: id, outcome: "COMPLETED" })).rejects.toBeInstanceOf(
      AttendanceTooEarlyError,
    );
    expect(store.statusOf(id)).toBe("CONFIRMED");
  });

  it("cancelado não pode ser marcado", async () => {
    const { id, attendance } = setup(AFTER_START, "CANCELED");

    await expect(attendance.execute({ tenantId: TENANT, appointmentId: id, outcome: "NO_SHOW" })).rejects.toBeInstanceOf(
      AppointmentClosedError,
    );
  });

  it("outra barbearia não encontra o agendamento", async () => {
    const { id, attendance } = setup(AFTER_START);

    await expect(attendance.execute({ tenantId: "tenant-b", appointmentId: id, outcome: "COMPLETED" })).rejects.toBeInstanceOf(
      AppointmentNotFoundError,
    );
  });
});

describe("cancelar pelo painel", () => {
  it("cancela o confirmado e registra o evento com cancelamento pela barbearia", async () => {
    const { store, id, cancel } = setup(BEFORE_START);

    const result = await cancel.execute({ tenantId: TENANT, appointmentId: id });

    expect(result).toEqual({ alreadyCanceled: false });
    expect(store.statusOf(id)).toBe("CANCELED");
    expect(store.outbox.at(-1)).toMatchObject({ type: "appointment.canceled", payload: { canceledBy: "OWNER" } });
  });

  it("não depende da janela de cancelamento do cliente", async () => {
    const { store, id, cancel } = setup(new Date("2026-11-23T17:55:00.000Z"));

    await cancel.execute({ tenantId: TENANT, appointmentId: id });

    expect(store.statusOf(id)).toBe("CANCELED");
  });

  it("cancelar de novo não é erro nem gera outro evento", async () => {
    const { store, id, cancel } = setup(BEFORE_START, "CANCELED");

    expect(await cancel.execute({ tenantId: TENANT, appointmentId: id })).toEqual({ alreadyCanceled: true });
    expect(store.outbox).toHaveLength(0);
  });

  it("atendido não pode ser cancelado", async () => {
    const { id, cancel } = setup(AFTER_START, "COMPLETED");

    await expect(cancel.execute({ tenantId: TENANT, appointmentId: id })).rejects.toBeInstanceOf(AppointmentClosedError);
  });
});
