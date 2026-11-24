import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LocalDay } from "@/shared/time/local-day";
import type { SchedulingRepository } from "@/modules/scheduling/application/ports/scheduling-repository";
import type { PrismaClient } from "@/shared/database/prisma";
import { oneService } from "../support/appointment-services";

const url = process.env.DATABASE_URL_TEST;
const TZ = "America/Fortaleza";
const MONDAY = "2030-03-04";
const at = (hhmm: string, date = MONDAY) => new Date(`${date}T${hhmm}:00-03:00`);

describe.skipIf(!url)("adapter Prisma do Horário livre (Postgres)", () => {
  let prisma: PrismaClient;
  let repo: SchedulingRepository;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    ({ prisma } = await import("@/shared/database/prisma"));
    const { PrismaSchedulingRepository } = await import(
      "@/modules/scheduling/infrastructure/prisma/prisma-scheduling-repository"
    );
    repo = new PrismaSchedulingRepository();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  async function newBarbearia({ professionalActive = true, serviceActive = true } = {}) {
    const tenant = await prisma.tenant.create({ data: { name: "Barbearia Teste", slug: `teste-${randomUUID().slice(0, 8)}` } });
    const professional = await prisma.professional.create({
      data: { tenantId: tenant.id, name: "Rafael", active: professionalActive },
    });
    const service = await prisma.service.create({
      data: { tenantId: tenant.id, name: "Corte", priceCents: 4000, durationMinutes: 30, active: serviceActive },
    });
    await prisma.professionalService.create({
      data: { tenantId: tenant.id, professionalId: professional.id, serviceId: service.id },
    });
    const customer = await prisma.customer.create({ data: { tenantId: tenant.id, name: "Carlos", phone: "+5585998765432" } });
    return { tenantId: tenant.id, professionalId: professional.id, serviceId: service.id, customerId: customer.id };
  }

  type Barbearia = Awaited<ReturnType<typeof newBarbearia>>;

  const addAppointment = (b: Barbearia, from: Date, to: Date, status: "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELED") =>
    prisma.appointment.create({
      data: {
        tenantId: b.tenantId,
        professionalId: b.professionalId,
        services: oneService(b.serviceId),
        customerId: b.customerId,
        startsAt: from,
        endsAt: to,
        status,
        priceSnapshotCents: 4000,
        serviceNameSnapshot: "Corte",
        durationSnapshotMinute: 30,
        customerNameSnapshot: "Carlos",
      },
    });

  const mondayFacts = (b: Barbearia, professionalId = b.professionalId) => {
    const { start, end } = LocalDay.parse(MONDAY, TZ).utcRange();
    return repo.getDayFacts({ tenantId: b.tenantId, professionalId, date: MONDAY, weekday: 1, dayStartUtc: start, dayEndUtc: end });
  };

  it("devolve o expediente do dia da semana e as exceções da data, com o tipo", async () => {
    const b = await newBarbearia();
    await prisma.availabilityRule.createMany({
      data: [
        { tenantId: b.tenantId, professionalId: b.professionalId, weekday: 1, startMinute: 540, endMinute: 720 },
        { tenantId: b.tenantId, professionalId: b.professionalId, weekday: 2, startMinute: 600, endMinute: 660 },
      ],
    });
    await prisma.availabilityException.createMany({
      data: [
        { tenantId: b.tenantId, professionalId: b.professionalId, date: new Date(`${MONDAY}T00:00:00.000Z`), type: "BLOCK", startMinute: 660, endMinute: 720 },
        { tenantId: b.tenantId, professionalId: b.professionalId, date: new Date(`${MONDAY}T00:00:00.000Z`), type: "DAY_OFF" },
        { tenantId: b.tenantId, professionalId: b.professionalId, date: new Date("2030-03-05T00:00:00.000Z"), type: "DAY_OFF" },
      ],
    });

    const facts = await mondayFacts(b);

    expect(facts.workingPeriods).toEqual([{ start: 540, end: 720 }]);
    expect(facts.exceptions).toEqual(
      expect.arrayContaining([
        { type: "BLOCK", range: { start: 660, end: 720 } },
        { type: "DAY_OFF", range: null },
      ]),
    );
    expect(facts.exceptions).toHaveLength(2);
  });

  it("devolve agendamentos de qualquer estado que tocam o dia, e só eles", async () => {
    const b = await newBarbearia();
    await addAppointment(b, at("09:00"), at("09:30"), "CONFIRMED");
    await addAppointment(b, at("10:00"), at("10:30"), "COMPLETED");
    await addAppointment(b, at("11:00"), at("11:30"), "CANCELED");
    await addAppointment(b, at("23:45", "2030-03-03"), at("00:15"), "NO_SHOW");
    await addAppointment(b, at("09:00", "2030-03-05"), at("09:30", "2030-03-05"), "CONFIRMED");

    const facts = await mondayFacts(b);

    expect(facts.appointments.map((a) => a.status).sort()).toEqual(["CANCELED", "COMPLETED", "CONFIRMED", "NO_SHOW"]);
  });

  it("não devolve nada de outra barbearia", async () => {
    const [a, b] = [await newBarbearia(), await newBarbearia()];
    await prisma.availabilityRule.create({
      data: { tenantId: b.tenantId, professionalId: b.professionalId, weekday: 1, startMinute: 540, endMinute: 720 },
    });
    await addAppointment(b, at("09:00"), at("09:30"), "CONFIRMED");

    expect(await mondayFacts(a, b.professionalId)).toEqual({ workingPeriods: [], exceptions: [], appointments: [] });
    expect(await repo.findOffer(a.tenantId, b.professionalId, [b.serviceId])).toBeNull();
  });

  it("findOffer traz o indicador de ativo, e null quando o profissional não executa o serviço", async () => {
    const active = await newBarbearia();
    const inactive = await newBarbearia({ professionalActive: false, serviceActive: false });
    const otherService = await prisma.service.create({
      data: { tenantId: active.tenantId, name: "Sobrancelha", priceCents: 2000, durationMinutes: 30 },
    });

    expect(await repo.findOffer(active.tenantId, active.professionalId, [active.serviceId])).toEqual({
      services: [{ id: active.serviceId, name: "Corte", priceCents: 4000, durationMinutes: 30, active: true }],
      professional: { name: "Rafael", active: true },
    });
    expect(await repo.findOffer(inactive.tenantId, inactive.professionalId, [inactive.serviceId])).toMatchObject({
      services: [{ active: false }],
      professional: { active: false },
    });
    expect(await repo.findOffer(active.tenantId, active.professionalId, [otherService.id])).toBeNull();
  });

  it("findOffer com vários serviços devolve na ordem pedida, e null se faltar um deles ao profissional", async () => {
    const b = await newBarbearia();
    const barba = await prisma.service.create({ data: { tenantId: b.tenantId, name: "Barba", priceCents: 2500, durationMinutes: 20 } });
    const sobrancelha = await prisma.service.create({
      data: { tenantId: b.tenantId, name: "Sobrancelha", priceCents: 2000, durationMinutes: 10 },
    });
    await prisma.professionalService.create({ data: { tenantId: b.tenantId, professionalId: b.professionalId, serviceId: barba.id } });

    const offer = await repo.findOffer(b.tenantId, b.professionalId, [barba.id, b.serviceId]);

    expect(offer?.services.map((service) => service.name)).toEqual(["Barba", "Corte"]);
    expect(await repo.findOffer(b.tenantId, b.professionalId, [b.serviceId, sobrancelha.id])).toBeNull();
  });
});
