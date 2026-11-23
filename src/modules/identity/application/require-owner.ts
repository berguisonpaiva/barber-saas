import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";

export interface OwnerContext {
  ownerId: string;
  tenantId: string;
  name: string | null | undefined;
  email: string | null | undefined;
}

/**
 * Data Access Layer: TODA operação administrativa começa aqui.
 * O tenantId vem da sessão — nunca de parâmetro enviado pelo navegador (RN-01).
 * Com cacheComponents, chame dentro de um <Suspense>.
 */
export async function requireOwner(): Promise<OwnerContext> {
  await connection();
  const session = await auth();
  const user = session?.user;
  if (!user?.tenantId || !user.id) redirect("/login");
  return { ownerId: user.id, tenantId: user.tenantId, name: user.name, email: user.email };
}
