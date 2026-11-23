import "server-only";
import { prisma } from "@/shared/database/prisma";
import { isUniqueViolation } from "@/shared/database/errors";
import { ConflictError } from "@/shared/errors/app-error";
import { hashPassword } from "@/shared/security/password";
import { randomCode } from "@/shared/security/token";
import { bookingSlugFor } from "@/modules/tenants/domain/slug";

export interface RegisterOwnerInput {
  ownerName: string;
  email: string;
  password: string;
  shopName: string;
  timezone?: string;
}

export interface RegisteredOwner {
  tenantId: string;
  ownerId: string;
  slug: string;
}

const SLUG_SUFFIX_LENGTH = 4;
const MAX_SLUG_ATTEMPTS = 5;

/**
 * RF-01/RF-02: cria tenant + proprietário numa transação.
 * O Link de agendamento é gerado aqui (nome + sufixo); se o sorteado já existir, sorteia de novo.
 */
export async function registerOwner(
  input: RegisterOwnerInput,
  randomSuffix: () => string = () => randomCode(SLUG_SUFFIX_LENGTH),
): Promise<RegisteredOwner> {
  const owner = { ...input, email: input.email.toLowerCase() };
  const passwordHash = await hashPassword(input.password);

  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
    const created = await createTenantWithOwner(owner, bookingSlugFor(input.shopName, randomSuffix()), passwordHash);
    if (created) return created;
  }
  throw new Error(`Nenhum link de agendamento livre em ${MAX_SLUG_ATTEMPTS} sorteios para "${input.shopName}".`);
}

/** null quando o link sorteado já pertence a outra barbearia. */
async function createTenantWithOwner(
  input: RegisterOwnerInput,
  slug: string,
  passwordHash: string,
): Promise<RegisteredOwner | null> {
  try {
    return await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: input.shopName.trim(), slug, timezone: input.timezone ?? "America/Fortaleza" },
        select: { id: true, slug: true },
      });
      const owner = await tx.owner.create({
        data: { tenantId: tenant.id, name: input.ownerName.trim(), email: input.email, passwordHash },
        select: { id: true },
      });
      return { tenantId: tenant.id, ownerId: owner.id, slug: tenant.slug };
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    if (await emailHasAccount(input.email)) throw new ConflictError("Já existe uma conta com esse e-mail.", "ALREADY_EXISTS");
    return null;
  }
}

async function emailHasAccount(email: string): Promise<boolean> {
  return (await prisma.owner.count({ where: { email } })) > 0;
}
