import "server-only";
import { prisma } from "@/shared/database/prisma";
import type { CoverStorage } from "../ports/cover-storage";
import { envCoverUrls } from "../../infrastructure/s3-cover-storage";

/** Nome e capa atual da barbearia da sessão (tenantId vem de requireOwner()). */
export async function getBarbeariaCover(
  tenantId: string,
  covers: Pick<CoverStorage, "publicUrl"> = envCoverUrls,
): Promise<{ shopName: string; coverUrl: string | null }> {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { name: true, coverImageKey: true },
  });
  return { shopName: tenant.name, coverUrl: tenant.coverImageKey ? covers.publicUrl(tenant.coverImageKey) : null };
}
