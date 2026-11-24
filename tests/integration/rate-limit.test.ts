import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TooManyRequestsError } from "@/shared/errors/app-error";
import type { PrismaClient } from "@/shared/database/prisma";

const url = process.env.DATABASE_URL_TEST;

describe.skipIf(!url)("limite de requisições (Postgres)", () => {
  let prisma: PrismaClient;
  let assertRateLimit: typeof import("@/shared/security/rate-limit").assertRateLimit;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    ({ prisma } = await import("@/shared/database/prisma"));
    ({ assertRateLimit } = await import("@/shared/security/rate-limit"));
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  const key = () => `teste:${randomUUID()}`;

  async function rejection(call: Promise<unknown>) {
    try {
      await call;
    } catch (error) {
      return error;
    }
    throw new Error("a chamada deveria ter sido barrada");
  }

  it("aceita até o limite e barra a chamada seguinte dizendo quando tentar de novo", async () => {
    const bucket = key();
    for (let call = 0; call < 3; call++) await assertRateLimit(bucket, 3, 60);

    const error = await rejection(assertRateLimit(bucket, 3, 60));

    expect(error).toBeInstanceOf(TooManyRequestsError);
    expect((error as TooManyRequestsError).retryAfterSeconds).toBeGreaterThan(0);
    expect((error as TooManyRequestsError).retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("depois que a janela vence, a contagem recomeça", async () => {
    const bucket = key();
    await assertRateLimit(bucket, 1, 60);
    await prisma.rateLimitBucket.update({ where: { key: bucket }, data: { resetAt: new Date(Date.now() - 1_000) } });

    await expect(assertRateLimit(bucket, 1, 60)).resolves.toBeUndefined();
  });

  it("cada chave tem sua própria contagem", async () => {
    const [first, second] = [key(), key()];
    await assertRateLimit(first, 1, 60);

    await expect(assertRateLimit(second, 1, 60)).resolves.toBeUndefined();
    await expect(assertRateLimit(first, 1, 60)).rejects.toBeInstanceOf(TooManyRequestsError);
  });

  it("chamadas simultâneas não passam do limite", async () => {
    const bucket = key();

    const results = await Promise.allSettled(Array.from({ length: 10 }, () => assertRateLimit(bucket, 4, 60)));

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(4);
  });
});
