import "server-only";
import { prisma } from "@/shared/database/prisma";
import { verifyPassword } from "@/shared/security/password";

/** Retorna o usuário para o Auth.js ou null (sem revelar se o e-mail existe). */
export async function authenticateOwner(email: string, password: string) {
  const owner = await prisma.owner.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, name: true, email: true, passwordHash: true, tenantId: true },
  });
  if (!owner) return null;
  const ok = await verifyPassword(password, owner.passwordHash);
  if (!ok) return null;
  return { id: owner.id, name: owner.name, email: owner.email, tenantId: owner.tenantId };
}
