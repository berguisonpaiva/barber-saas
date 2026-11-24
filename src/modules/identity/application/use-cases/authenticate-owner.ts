import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/shared/database/prisma";
import { hashPassword, verifyPassword } from "@/shared/security/password";

let decoyHash: Promise<string> | undefined;
const decoyPasswordHash = () => (decoyHash ??= hashPassword(randomUUID()));

/**
 * Retorna o usuário para o Auth.js ou null (sem revelar se o e-mail existe).
 * E-mail sem conta também passa pelo bcrypt, contra um hash descartável, para as duas respostas levarem o mesmo tempo.
 */
export async function authenticateOwner(email: string, password: string) {
  const owner = await prisma.owner.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, name: true, email: true, passwordHash: true, tenantId: true },
  });
  const ok = await verifyPassword(password, owner?.passwordHash ?? (await decoyPasswordHash()));
  if (!owner || !ok) return null;
  return { id: owner.id, name: owner.name, email: owner.email, tenantId: owner.tenantId };
}
