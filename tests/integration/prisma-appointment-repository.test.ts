import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Appointment } from "@/modules/appointments/domain/appointment";
import { SlotUnavailableError } from "@/modules/appointments/domain/errors";
import type {
  AppointmentRepository,
  NewAppointmentRecord,
} from "@/modules/appointments/application/ports/appointment-repository";
import { generateToken, hashToken } from "@/shared/security/token";
import type { PrismaClient } from "@/shared/database/prisma";

const url = process.env.DATABASE_URL_TEST;
const at = (hhmm: string) => new Date(`2030-03-04T${hhmm}:00-03:00`);
const carlos = { name: "Carlos", phone: "+5585998765432" };

interface Barbearia {
  tenantId: string;
  professionalId: string;
  serviceId: string;
}

describe.skipIf(!url)("adapter Prisma do Agendamento (Postgres)", () => {
  let prisma: PrismaClient;
  let repo: AppointmentRepository;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    ({ prisma } = await import("@/shared/database/prisma"));
    const { PrismaAppointmentRepository } = await import(
      "@/modules/appointments/infrastructure/prisma/prisma-appointment-repository"
    );
    repo = new PrismaAppointmentRepository();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  async function newBarbearia(): Promise<Barbearia> {
    const tenant = await prisma.tenant.create({ data: { name: "Barbearia Teste", slug: `teste-${randomUUID().slice(0, 8)}` } });
    const professional = await prisma.professional.create({ data: { tenantId: tenant.id, name: "Rafael" } });
    const service = await prisma.service.create({
      data: { tenantId: tenant.id, name: "Corte", priceCents: 4000, durationMinutes: 30 },
    });
    return { tenantId: tenant.id, professionalId: professional.id, serviceId: service.id };
  }

  function newBooking(barbearia: Barbearia, startsAt: Date, customer = carlos) {
    const id = randomUUID();
    const token = generateToken();
    const endsAt = new Date(startsAt.getTime() + 30 * 60_000);
    const booking = Appointment.book({
      id,
      startsAt,
      customerName: customer.name,
      serviceName: "Corte",
      professionalName: "Rafael",
      timeZone: "America/Fortaleza",
    });
    const record: NewAppointmentRecord = {
      id,
      ...barbearia,
      customer,
      startsAt,
      endsAt,
      status: booking.status,
      priceCents: 4000,
      serviceName: "Corte",
      durationMinutes: 30,
      cancelTokenHash: hashToken(token),
      cancelTokenExpiresAt: endsAt,
      source: "PUBLIC_LINK",
      event: booking.event,
    };
    return { record, token };
  }

  const outboxTypes = async (tenantId: string) =>
    (await prisma.outboxEvent.findMany({ where: { tenantId }, orderBy: { createdAt: "asc" } })).map((e) => e.type);

  it("o banco recusa um Confirmado sobreposto do mesmo profissional, mas aceita o horário seguinte", async () => {
    const barbearia = await newBarbearia();
    await repo.insert(newBooking(barbearia, at("09:00")).record);

    await expect(repo.insert(newBooking(barbearia, at("09:15"), { name: "Bruno", phone: "+5585988887777" }).record))
      .rejects.toThrow(SlotUnavailableError);
    await expect(repo.insert(newBooking(barbearia, at("09:30")).record)).resolves.toBeUndefined();
  });

  it("quando a gravação falha, nada fica: nem agendamento, nem evento, nem cliente novo", async () => {
    const barbearia = await newBarbearia();
    await repo.insert(newBooking(barbearia, at("10:00")).record);
    const rejected = newBooking(barbearia, at("10:00"), { name: "Bruno", phone: "+5585988887777" });

    await expect(repo.insert(rejected.record)).rejects.toThrow(SlotUnavailableError);

    expect(await repo.findByCancelTokenHash(barbearia.tenantId, hashToken(rejected.token))).toBeNull();
    expect(await outboxTypes(barbearia.tenantId)).toEqual(["appointment.confirmed"]);
    expect(await prisma.customer.count({ where: { tenantId: barbearia.tenantId, phone: "+5585988887777" } })).toBe(0);
  });

  it("grava o cancelamento só uma vez, e o link continua encontrando o agendamento cancelado", async () => {
    const barbearia = await newBarbearia();
    const { record, token } = newBooking(barbearia, at("11:00"));
    await repo.insert(record);
    const found = await repo.findByCancelTokenHash(barbearia.tenantId, hashToken(token));
    const cancellation = found!.cancelByCustomer(new Date());
    if (cancellation.outcome !== "canceled") throw new Error("esperava um cancelamento");
    const cancel = { tenantId: barbearia.tenantId, appointmentId: record.id, by: "CUSTOMER" as const, at: new Date() };

    await expect(repo.recordCancellation({ ...cancel, event: cancellation.event })).resolves.toBe("recorded");
    await expect(repo.recordCancellation({ ...cancel, event: cancellation.event })).resolves.toBe("not-confirmed");

    expect((await repo.findByCancelTokenHash(barbearia.tenantId, hashToken(token)))?.isCanceled()).toBe(true);
    expect(await outboxTypes(barbearia.tenantId)).toEqual(["appointment.confirmed", "appointment.canceled"]);
  });

  it("cada agendamento guarda o nome informado nele, mesmo com o mesmo WhatsApp", async () => {
    const barbearia = await newBarbearia();
    const forPedro = newBooking(barbearia, at("14:00"), { name: "Pedro", phone: carlos.phone });
    await repo.insert(forPedro.record);
    await repo.insert(newBooking(barbearia, at("15:00"), { name: "Carlos", phone: carlos.phone }).record);

    const pedro = await repo.findByCancelTokenHash(barbearia.tenantId, hashToken(forPedro.token));
    const cancellation = pedro!.cancelByCustomer(new Date());

    expect(cancellation.outcome === "canceled" && cancellation.event.payload.customerName).toBe("Pedro");
  });

  it("não encontra o link de uma barbearia a partir de outra", async () => {
    const [a, b] = [await newBarbearia(), await newBarbearia()];
    const { record, token } = newBooking(a, at("16:00"));
    await repo.insert(record);

    expect(await repo.findByCancelTokenHash(b.tenantId, hashToken(token))).toBeNull();
  });
});
