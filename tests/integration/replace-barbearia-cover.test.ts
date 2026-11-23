import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ValidationError } from "@/shared/errors/app-error";
import type { PrismaClient } from "@/shared/database/prisma";
import { InMemoryCoverStorage } from "../support/in-memory-cover-storage";

const url = process.env.DATABASE_URL_TEST;
type ReplaceCover = typeof import("@/modules/tenants/application/use-cases/replace-barbearia-cover").replaceBarbeariaCover;
type GetPublicTenant = typeof import("@/modules/tenants/application/use-cases/get-public-tenant").getPublicTenant;

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(32).fill(1)]);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, ...new Array(32).fill(2)]);

describe.skipIf(!url)("trocar a foto de capa da barbearia (Postgres)", () => {
  let prisma: PrismaClient;
  let replaceBarbeariaCover: ReplaceCover;
  let getPublicTenant: GetPublicTenant;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    ({ prisma } = await import("@/shared/database/prisma"));
    ({ replaceBarbeariaCover } = await import("@/modules/tenants/application/use-cases/replace-barbearia-cover"));
    ({ getPublicTenant } = await import("@/modules/tenants/application/use-cases/get-public-tenant"));
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  const newBarbearia = () =>
    prisma.tenant.create({
      data: { name: "Barbearia Capa", slug: `capa-${randomUUID().slice(0, 8)}` },
      select: { id: true, slug: true },
    });

  it("a foto enviada vira a capa da página pública", async () => {
    const storage = new InMemoryCoverStorage();
    const barbearia = await newBarbearia();

    const { coverUrl } = await replaceBarbeariaCover(barbearia.id, PNG, storage);

    expect(coverUrl).toMatch(new RegExp(`^https://capas\\.teste/tenants/${barbearia.id}/cover-[a-z0-9]+\\.png$`));
    expect((await getPublicTenant(barbearia.slug, storage)).coverUrl).toBe(coverUrl);
  });

  it("sem foto enviada, a página pública não tem capa", async () => {
    const barbearia = await newBarbearia();

    expect((await getPublicTenant(barbearia.slug, new InMemoryCoverStorage())).coverUrl).toBeNull();
  });

  it("trocar a capa apaga a foto antiga do storage", async () => {
    const storage = new InMemoryCoverStorage();
    const barbearia = await newBarbearia();
    await replaceBarbeariaCover(barbearia.id, PNG, storage);

    await replaceBarbeariaCover(barbearia.id, JPEG, storage);

    expect(storage.keys).toHaveLength(1);
    expect(storage.contentTypeOf(storage.keys[0])).toBe("image/jpeg");
  });

  it("se apagar a foto antiga falhar, a troca continua valendo", async () => {
    const barbearia = await newBarbearia();
    await replaceBarbeariaCover(barbearia.id, PNG, new InMemoryCoverStorage());
    const unreliable = new InMemoryCoverStorage({ failRemovals: true });

    const { coverUrl } = await replaceBarbeariaCover(barbearia.id, JPEG, unreliable);

    expect((await getPublicTenant(barbearia.slug, unreliable)).coverUrl).toBe(coverUrl);
  });

  it.each([
    ["um arquivo que não é foto", Uint8Array.from([...new Array(64).fill(0x41)])],
    ["uma foto acima de 5 MB", Uint8Array.from([0xff, 0xd8, 0xff, ...new Array(5 * 1024 * 1024).fill(0)])],
    ["um arquivo vazio", new Uint8Array()],
  ])("recusa %s sem gravar nada", async (_case, bytes) => {
    const storage = new InMemoryCoverStorage();
    const barbearia = await newBarbearia();

    await expect(replaceBarbeariaCover(barbearia.id, bytes, storage)).rejects.toThrow(ValidationError);
    expect(storage.keys).toEqual([]);
  });
});
