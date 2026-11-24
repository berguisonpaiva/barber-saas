import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hasPgCode, isForeignKeyViolation, PG_EXCLUSION_VIOLATION } from "@/shared/database/errors";
import type { PrismaClient } from "@/shared/database/prisma";
import { oneService } from "../support/appointment-services";

/** PRD §12: o proprietário do tenant A não pode consultar nem alterar dados do tenant B. */
const url = process.env.DATABASE_URL_TEST;
const DAY = "2030-05-06";
const at = (hhmm: string) => new Date(`${DAY}T${hhmm}:00-03:00`);

interface Barbearia {
  tenantId: string;
  professionalId: string;
  serviceId: string;
  customerId: string;
}

describe.skipIf(!url)("isolamento multitenant (Postgres)", () => {
  let prisma: PrismaClient;
  let listAgenda: typeof import("@/modules/appointments/application/use-cases/list-agenda").listAgenda;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    ({ prisma } = await import("@/shared/database/prisma"));
    ({ listAgenda } = await import("@/modules/appointments/application/use-cases/list-agenda"));
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  async function newBarbearia(): Promise<Barbearia> {
    const tenant = await prisma.tenant.create({
      data: { name: "Barbearia Isolada", slug: `isolada-${randomUUID().slice(0, 8)}`, timezone: "America/Fortaleza" },
    });
    const professional = await prisma.professional.create({ data: { tenantId: tenant.id, name: "Rafael" } });
    const service = await prisma.service.create({
      data: { tenantId: tenant.id, name: "Corte", priceCents: 4000, durationMinutes: 30 },
    });
    const customer = await prisma.customer.create({
      data: { tenantId: tenant.id, name: "Carlos", phone: `+55859${String(Math.random()).slice(2, 10)}` },
    });
    return { tenantId: tenant.id, professionalId: professional.id, serviceId: service.id, customerId: customer.id };
  }

  function insertAppointment({ serviceId, ...ids }: Barbearia, startsAt: Date, status: "CONFIRMED" | "CANCELED" = "CONFIRMED") {
    return prisma.appointment.create({
      data: {
        ...ids,
        services: oneService(serviceId),
        startsAt,
        endsAt: new Date(startsAt.getTime() + 30 * 60_000),
        status,
        priceSnapshotCents: 4000,
        serviceNameSnapshot: "Corte",
        durationSnapshotMinute: 30,
        customerNameSnapshot: "Carlos",
      },
    });
  }

  async function rejection(write: Promise<unknown>): Promise<unknown> {
    try {
      await write;
    } catch (error) {
      return error;
    }
    throw new Error("a gravação deveria ter sido recusada pelo banco");
  }

  it("a agenda de uma barbearia não mostra agendamentos de outra no mesmo dia", async () => {
    const a = await newBarbearia();
    const b = await newBarbearia();
    const own = await insertAppointment(a, at("09:00"));
    await insertAppointment(b, at("09:00"));

    const agenda = await listAgenda(a.tenantId, DAY);

    expect(agenda.appointments.map((appointment) => appointment.id)).toEqual([own.id]);
  });

  it("o banco recusa agendamento que aponta para profissional, serviço ou cliente de outra barbearia", async () => {
    const a = await newBarbearia();
    const b = await newBarbearia();

    for (const foreign of [
      { professionalId: b.professionalId },
      { serviceId: b.serviceId },
      { customerId: b.customerId },
    ]) {
      expect(isForeignKeyViolation(await rejection(insertAppointment({ ...a, ...foreign }, at("10:00"))))).toBe(true);
    }
    expect(await prisma.appointment.count({ where: { tenantId: a.tenantId } })).toBe(0);
  });

  it("o banco recusa dois confirmados sobrepostos do mesmo profissional, mas não bloqueia cancelados nem outra barbearia", async () => {
    const a = await newBarbearia();
    const b = await newBarbearia();
    await insertAppointment(a, at("14:00"));

    const overlap = await rejection(insertAppointment(a, at("14:15")));
    expect(hasPgCode(overlap, PG_EXCLUSION_VIOLATION)).toBe(true);

    await expect(insertAppointment(a, at("14:15"), "CANCELED")).resolves.toBeDefined();
    await expect(insertAppointment(b, at("14:15"))).resolves.toBeDefined();
  });
});
