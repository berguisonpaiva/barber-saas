import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@/shared/security/password";
import type { PrismaClient } from "@/shared/database/prisma";

const url = process.env.DATABASE_URL_TEST;
const PASSWORD = "senha-forte-123";

describe.skipIf(!url)("login do proprietário (Postgres)", () => {
  let prisma: PrismaClient;
  let authenticateOwner: typeof import("@/modules/identity/application/use-cases/authenticate-owner").authenticateOwner;
  let owner: { id: string; tenantId: string; email: string };

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    ({ prisma } = await import("@/shared/database/prisma"));
    ({ authenticateOwner } = await import("@/modules/identity/application/use-cases/authenticate-owner"));
    const tenant = await prisma.tenant.create({ data: { name: "Barbearia Login", slug: `login-${randomUUID().slice(0, 8)}` } });
    owner = await prisma.owner.create({
      data: { tenantId: tenant.id, name: "João", email: `joao-${randomUUID()}@teste.dev`, passwordHash: await hashPassword(PASSWORD) },
      select: { id: true, tenantId: true, email: true },
    });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("senha certa devolve o proprietário com a barbearia, sem o hash da senha", async () => {
    const user = await authenticateOwner(owner.email, PASSWORD);

    expect(user).toEqual({ id: owner.id, name: "João", email: owner.email, tenantId: owner.tenantId });
  });

  it("o e-mail é aceito com letras maiúsculas", async () => {
    expect(await authenticateOwner(owner.email.toUpperCase(), PASSWORD)).toMatchObject({ id: owner.id });
  });

  it("senha errada não entra", async () => {
    expect(await authenticateOwner(owner.email, "senha-errada")).toBeNull();
  });

  it("e-mail sem conta não entra", async () => {
    expect(await authenticateOwner(`ninguem-${randomUUID()}@teste.dev`, PASSWORD)).toBeNull();
  });
});
