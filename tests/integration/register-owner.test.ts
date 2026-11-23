import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ConflictError } from "@/shared/errors/app-error";
import type { PrismaClient } from "@/shared/database/prisma";

const url = process.env.DATABASE_URL_TEST;
type RegisterOwner = typeof import("@/modules/identity/application/use-cases/register-owner").registerOwner;

describe.skipIf(!url)("cadastro do proprietário gera o Link de agendamento (Postgres)", () => {
  let prisma: PrismaClient;
  let registerOwner: RegisterOwner;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    ({ prisma } = await import("@/shared/database/prisma"));
    ({ registerOwner } = await import("@/modules/identity/application/use-cases/register-owner"));
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  const owner = (shopName: string, email = `dono-${randomUUID().slice(0, 8)}@teste.com`) => ({
    ownerName: "Dono Teste",
    email,
    password: "senha-de-teste-123",
    shopName,
  });
  const suffixes = (...values: string[]) => () => values.shift() ?? "zzzz";

  it("o link é o nome da barbearia seguido de um sufixo de 4 caracteres", async () => {
    const shopName = `Barbearia do João ${randomUUID().slice(0, 6)}`;

    const { slug } = await registerOwner(owner(shopName));

    expect(slug).toMatch(/^barbearia-do-joao-[a-z0-9]{6}-[a-z0-9]{4}$/);
  });

  it("duas barbearias com o mesmo nome recebem links diferentes", async () => {
    const shopName = `Mesmo Nome ${randomUUID().slice(0, 6)}`;

    const first = await registerOwner(owner(shopName));
    const second = await registerOwner(owner(shopName));

    expect(first.slug).not.toBe(second.slug);
  });

  it("se o link sorteado já existe, sorteia de novo em vez de falhar", async () => {
    const shopName = `Colisao ${randomUUID().slice(0, 6)}`;
    const first = await registerOwner(owner(shopName), suffixes("aaaa"));

    const second = await registerOwner(owner(shopName), suffixes("aaaa", "bbbb"));

    expect(first.slug.endsWith("-aaaa")).toBe(true);
    expect(second.slug.endsWith("-bbbb")).toBe(true);
  });

  it("um e-mail que já tem conta é recusado, sem criar outra barbearia", async () => {
    const email = `repetido-${randomUUID().slice(0, 8)}@teste.com`;
    await registerOwner(owner("Primeira Barbearia", email));
    const shopName = `Segunda ${randomUUID().slice(0, 6)}`;

    await expect(registerOwner(owner(shopName, email))).rejects.toThrow(ConflictError);
    expect(await prisma.tenant.count({ where: { name: shopName } })).toBe(0);
  });
});
