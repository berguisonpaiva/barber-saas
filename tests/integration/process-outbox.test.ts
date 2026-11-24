import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/shared/database/prisma";
import type { SendResult } from "@/modules/notifications/infrastructure/web-push-sender";

const url = process.env.DATABASE_URL_TEST;
const BATCH = 1_000;

type Delivery = { endpoint: string; title: string };
const push = vi.hoisted(() => ({
  deliveries: [] as Delivery[],
  answer: (_endpoint: string): Promise<SendResult> => Promise.resolve("sent"),
}));

vi.mock("@/modules/notifications/infrastructure/web-push-sender", () => ({
  sendPush: (sub: { endpoint: string }, message: { title: string }) => {
    push.deliveries.push({ endpoint: sub.endpoint, title: message.title });
    return push.answer(sub.endpoint);
  },
}));

const payload = (appointmentId = randomUUID()) => ({
  appointmentId,
  customerName: "Carlos",
  serviceName: "Corte",
  professionalName: "Rafael",
  startsAt: "2030-03-04T12:00:00.000Z",
  timeZone: "America/Fortaleza",
});

describe.skipIf(!url)("processador do outbox (Postgres)", () => {
  let prisma: PrismaClient;
  let processOutbox: typeof import("@/modules/notifications/application/use-cases/process-outbox").processOutbox;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    ({ prisma } = await import("@/shared/database/prisma"));
    ({ processOutbox } = await import("@/modules/notifications/application/use-cases/process-outbox"));
  });

  beforeEach(() => {
    push.deliveries = [];
    push.answer = () => Promise.resolve("sent");
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  async function newBarbeariaWithDevice() {
    const tenant = await prisma.tenant.create({ data: { name: "Barbearia Push", slug: `push-${randomUUID().slice(0, 8)}` } });
    const owner = await prisma.owner.create({
      data: { tenantId: tenant.id, name: "João", email: `${randomUUID()}@teste.dev`, passwordHash: "x" },
    });
    const device = await prisma.pushSubscription.create({
      data: { tenantId: tenant.id, ownerId: owner.id, endpoint: `https://push.teste/${randomUUID()}`, p256dh: "p", auth: "a" },
    });
    return { tenantId: tenant.id, device };
  }

  const enqueue = (tenantId: string, data: { type?: string; attempts?: number; availableAt?: Date } = {}) =>
    prisma.outboxEvent.create({
      data: { tenantId, type: data.type ?? "appointment.confirmed", payload: payload(), ...data },
    });

  const reload = (id: string) => prisma.outboxEvent.findUniqueOrThrow({ where: { id } });

  it("entrega o novo agendamento ao aparelho do proprietário e marca o evento como feito", async () => {
    const { tenantId, device } = await newBarbeariaWithDevice();
    const event = await enqueue(tenantId);

    await processOutbox(BATCH);

    expect(push.deliveries).toContainEqual({ endpoint: device.endpoint, title: "Novo agendamento" });
    expect(await reload(event.id)).toMatchObject({ status: "DONE", attempts: 1, lastError: null });
    expect((await prisma.pushSubscription.findUniqueOrThrow({ where: { id: device.id } })).lastSuccessAt).not.toBeNull();
  });

  it("não notifica aparelhos de outra barbearia", async () => {
    const owner = await newBarbeariaWithDevice();
    const other = await newBarbeariaWithDevice();
    await enqueue(owner.tenantId);

    await processOutbox(BATCH);

    const endpoints = push.deliveries.map((delivery) => delivery.endpoint);
    expect(endpoints).toContain(owner.device.endpoint);
    expect(endpoints).not.toContain(other.device.endpoint);
  });

  it("inscrição expirada no serviço de push é desativada", async () => {
    const { tenantId, device } = await newBarbeariaWithDevice();
    push.answer = (endpoint) => Promise.resolve(endpoint === device.endpoint ? "gone" : "sent");
    await enqueue(tenantId);

    await processOutbox(BATCH);

    expect((await prisma.pushSubscription.findUniqueOrThrow({ where: { id: device.id } })).enabled).toBe(false);
  });

  it("se o envio quebrar, o evento volta para a fila com espera crescente e o erro registrado", async () => {
    const { tenantId, device } = await newBarbeariaWithDevice();
    push.answer = (endpoint) => (endpoint === device.endpoint ? Promise.reject(new Error("serviço fora")) : Promise.resolve("sent"));
    const event = await enqueue(tenantId);
    const before = Date.now();

    await processOutbox(BATCH);

    const retried = await reload(event.id);
    expect(retried).toMatchObject({ status: "PENDING", attempts: 1 });
    expect(retried.lastError).toContain("serviço fora");
    expect(retried.availableAt.getTime()).toBeGreaterThanOrEqual(before + 2 * 60_000);
  });

  it("na quinta tentativa sem sucesso o evento é dado como falho", async () => {
    const { tenantId, device } = await newBarbeariaWithDevice();
    push.answer = (endpoint) => (endpoint === device.endpoint ? Promise.reject(new Error("serviço fora")) : Promise.resolve("sent"));
    const event = await enqueue(tenantId, { attempts: 4 });

    await processOutbox(BATCH);

    expect(await reload(event.id)).toMatchObject({ status: "FAILED", attempts: 5 });
  });

  it("evento agendado para depois fica na fila sem ser tocado", async () => {
    const { tenantId } = await newBarbeariaWithDevice();
    const event = await enqueue(tenantId, { availableAt: new Date(Date.now() + 60 * 60_000) });

    await processOutbox(BATCH);

    expect(await reload(event.id)).toMatchObject({ status: "PENDING", attempts: 0 });
  });
});
