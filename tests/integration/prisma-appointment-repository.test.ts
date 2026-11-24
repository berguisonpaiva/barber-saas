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
import { combineServices, type SelectedService } from "@/modules/scheduling/domain/service-selection";

const url = process.env.DATABASE_URL_TEST;
const at = (hhmm: string) => new Date(`2030-03-04T${hhmm}:00-03:00`);
const carlos = { name: "Carlos", phone: "+5585998765432" };

interface Barbearia {
  tenantId: string;
  professionalId: string;
  corte: SelectedService;
  barba: SelectedService;
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
    const newService = async (name: string, priceCents: number, durationMinutes: number) => {
      const { id } = await prisma.service.create({ data: { tenantId: tenant.id, name, priceCents, durationMinutes } });
      return { id, name, priceCents, durationMinutes };
    };
    return {
      tenantId: tenant.id,
      professionalId: professional.id,
      corte: await newService("Corte", 4000, 30),
      barba: await newService("Barba", 2500, 20),
    };
  }

  function newBooking(barbearia: Barbearia, startsAt: Date, customer = carlos, services = [barbearia.corte]) {
    const id = randomUUID();
    const token = generateToken();
    const combination = combineServices(services);
    const endsAt = new Date(startsAt.getTime() + combination.durationMinutes * 60_000);
    const booking = Appointment.book({
      id,
      startsAt,
      customerName: customer.name,
      serviceName: combination.name,
      professionalName: "Rafael",
      timeZone: "America/Fortaleza",
    });
    const record: NewAppointmentRecord = {
      id,
      tenantId: barbearia.tenantId,
      professionalId: barbearia.professionalId,
      services: combination.services,
      customer,
      startsAt,
      endsAt,
      status: booking.status,
      priceCents: combination.priceCents,
      serviceName: combination.name,
      durationMinutes: combination.durationMinutes,
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

  it("grava cada serviço do agendamento na ordem escolhida, com o que valia na marcação", async () => {
    const barbearia = await newBarbearia();
    const { record } = newBooking(barbearia, at("17:00"), carlos, [barbearia.barba, barbearia.corte]);
    await repo.insert(record);
    await prisma.service.update({ where: { id: barbearia.corte.id }, data: { priceCents: 9900, name: "Corte novo" } });

    const appointment = await prisma.appointment.findUniqueOrThrow({
      where: { id: record.id },
      select: {
        serviceNameSnapshot: true,
        priceSnapshotCents: true,
        durationSnapshotMinute: true,
        endsAt: true,
        services: {
          orderBy: { position: "asc" },
          select: { serviceId: true, serviceNameSnapshot: true, priceSnapshotCents: true, durationSnapshotMinute: true },
        },
      },
    });

    expect(appointment).toEqual({
      serviceNameSnapshot: "Barba + Corte",
      priceSnapshotCents: 6500,
      durationSnapshotMinute: 50,
      endsAt: at("17:50"),
      services: [
        { serviceId: barbearia.barba.id, serviceNameSnapshot: "Barba", priceSnapshotCents: 2500, durationSnapshotMinute: 20 },
        { serviceId: barbearia.corte.id, serviceNameSnapshot: "Corte", priceSnapshotCents: 4000, durationSnapshotMinute: 30 },
      ],
    });
  });

  it("não encontra o link de uma barbearia a partir de outra", async () => {
    const [a, b] = [await newBarbearia(), await newBarbearia()];
    const { record, token } = newBooking(a, at("16:00"));
    await repo.insert(record);

    expect(await repo.findByCancelTokenHash(b.tenantId, hashToken(token))).toBeNull();
  });
});
