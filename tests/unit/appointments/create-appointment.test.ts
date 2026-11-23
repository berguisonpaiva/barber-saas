import { describe, expect, it } from "vitest";
import { CreateAppointment } from "@/modules/appointments/application/use-cases/create-appointment";
import { CancelAppointmentByToken } from "@/modules/appointments/application/use-cases/cancel-appointment-by-token";
import { GetAvailableSlots } from "@/modules/scheduling/application/use-cases/get-available-slots";
import { SlotUnavailableError } from "@/modules/appointments/domain/errors";
import { NotFoundError, ValidationError } from "@/shared/errors/app-error";
import { InMemoryAppointmentStore } from "../../support/in-memory-appointment-store";

const TENANT = "tenant-a";
const PROFESSIONAL = "prof-rafael";
const SERVICE = "svc-corte";
const MONDAY = "2026-11-23";
const at = (hhmm: string) => new Date(`${MONDAY}T${hhmm}:00-03:00`);

function setup(now = "2026-11-20T12:00:00.000Z") {
  const store = new InMemoryAppointmentStore();
  store.addBarbearia({
    tenantId: TENANT,
    timeZone: "America/Fortaleza",
    slotIntervalMinutes: 30,
    minAdvanceMinutes: 120,
    maxAdvanceDays: 30,
    cancellationWindowMinutes: 120,
  });
  store.addProfessional({ tenantId: TENANT, id: PROFESSIONAL, name: "Rafael", weekly: { 1: [{ start: 9 * 60, end: 12 * 60 }] } });
  store.addService({
    tenantId: TENANT,
    id: SERVICE,
    name: "Corte",
    priceCents: 4000,
    durationMinutes: 30,
    professionalIds: [PROFESSIONAL],
  });

  const clock = { now: () => new Date(now) };
  const slots = new GetAvailableSlots(store, clock);
  const book = new CreateAppointment(store, slots, store);
  const cancel = new CancelAppointmentByToken(store, clock);
  const freeTimes = async () =>
    (await slots.execute({ tenantId: TENANT, professionalId: PROFESSIONAL, serviceId: SERVICE, date: MONDAY })).slots.map(
      (s) => s.toISOString(),
    );
  return { store, book, cancel, freeTimes };
}

const carlos = { name: "Carlos", phone: "(85) 99876-5432" };
const booking = (startsAt: Date, customer = carlos) => ({
  tenantId: TENANT,
  professionalId: PROFESSIONAL,
  serviceId: SERVICE,
  startsAt,
  customer,
});

describe("marcar um agendamento", () => {
  it("num horário livre, confirma, ocupa o horário, avisa o proprietário e entrega um link que cancela", async () => {
    const { store, book, cancel, freeTimes } = setup();

    const result = await book.execute(booking(at("09:00")));

    expect(result).toMatchObject({ startsAt: at("09:00"), endsAt: at("09:30") });
    expect(await freeTimes()).not.toContain(at("09:00").toISOString());
    expect(store.outbox).toEqual([
      {
        type: "appointment.confirmed",
        payload: {
          appointmentId: result.appointmentId,
          customerName: "Carlos",
          serviceName: "Corte",
          professionalName: "Rafael",
          startsAt: at("09:00").toISOString(),
          timeZone: "America/Fortaleza",
        },
      },
    ]);
    await expect(cancel.execute({ tenantId: TENANT, token: result.cancelToken })).resolves.toEqual({
      appointmentId: result.appointmentId,
      alreadyCanceled: false,
    });
  });

  it("num horário que não está livre, recusa sem avisar ninguém", async () => {
    const { store, book } = setup();
    await book.execute(booking(at("09:00")));

    await expect(book.execute(booking(at("09:00"), { name: "Bruno", phone: "85 98888-7777" }))).rejects.toThrow(
      SlotUnavailableError,
    );
    expect(store.outbox).toHaveLength(1);
  });

  it.each([
    ["fora do expediente", "13:00", "2026-11-20T12:00:00.000Z"],
    ["fora da grade de horários", "09:10", "2026-11-20T12:00:00.000Z"],
    ["antes da antecedência mínima", "09:00", "2026-11-23T11:30:00.000Z"],
  ])("%s, recusa como horário indisponível", async (_case, hhmm, now) => {
    const { store, book } = setup(now);

    await expect(book.execute(booking(at(hhmm)))).rejects.toThrow(SlotUnavailableError);
    expect(store.outbox).toEqual([]);
  });

  it("dois clientes no mesmo horário ao mesmo tempo: um marca, o outro recebe horário indisponível", async () => {
    const { store, book } = setup();

    const results = await Promise.allSettled([
      book.execute(booking(at("10:00"))),
      book.execute(booking(at("10:00"), { name: "Bruno", phone: "85 98888-7777" })),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual(["fulfilled", "rejected"]);
    const rejected = results.find((r) => r.status === "rejected");
    expect(rejected?.status === "rejected" && rejected.reason).toBeInstanceOf(SlotUnavailableError);
    expect(store.outbox).toHaveLength(1);
  });

  it.each([
    ["nome curto", { name: "C", phone: "(85) 99876-5432" }],
    ["WhatsApp sem DDD", { name: "Carlos", phone: "99876-5432" }],
  ])("com %s, recusa como dado inválido", async (_case, customer) => {
    const { store, book } = setup();

    await expect(book.execute(booking(at("09:00"), customer))).rejects.toThrow(ValidationError);
    expect(store.outbox).toEqual([]);
  });

  it("o mesmo WhatsApp com outro nome: cada agendamento fica com o nome informado nele", async () => {
    const { store, book, cancel } = setup();
    const forPedro = await book.execute(booking(at("09:00"), { name: "Pedro", phone: carlos.phone }));
    await book.execute(booking(at("10:00"), { name: "Carlos", phone: carlos.phone }));

    await cancel.execute({ tenantId: TENANT, token: forPedro.cancelToken });

    expect(store.outbox.map((e) => [e.type, e.payload.customerName])).toEqual([
      ["appointment.confirmed", "Pedro"],
      ["appointment.confirmed", "Carlos"],
      ["appointment.canceled", "Pedro"],
    ]);
  });

  it("numa barbearia que não existe, responde não encontrada", async () => {
    const { book } = setup();

    await expect(book.execute({ ...booking(at("09:00")), tenantId: "tenant-inexistente" })).rejects.toThrow(
      NotFoundError,
    );
  });
});
