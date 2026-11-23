import "server-only";
import { prisma } from "@/shared/database/prisma";
import { ValidationError } from "@/shared/errors/app-error";
import { randomCode } from "@/shared/security/token";
import { coverImageTypeOf, MAX_COVER_BYTES } from "../../domain/cover-image";
import type { CoverStorage } from "../ports/cover-storage";

/**
 * Troca a foto de capa da barbearia da sessão (tenantId vem de requireOwner()).
 * A foto antiga é apagada depois; se apagar falhar, a troca continua valendo.
 */
export async function replaceBarbeariaCover(
  tenantId: string,
  bytes: Uint8Array,
  storage: CoverStorage,
  newId: () => string = () => randomCode(10),
): Promise<{ coverUrl: string }> {
  if (bytes.byteLength > MAX_COVER_BYTES) throw new ValidationError("A foto pode ter até 5 MB.");
  const type = coverImageTypeOf(bytes);
  if (!type) throw new ValidationError("Envie uma foto JPEG, PNG ou WebP.");

  const previous = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { coverImageKey: true } });
  const key = `tenants/${tenantId}/cover-${newId()}.${type.extension}`;
  await storage.put(key, bytes, type.contentType);
  await prisma.tenant.update({ where: { id: tenantId }, data: { coverImageKey: key } });

  if (previous.coverImageKey) await removeWithoutUndoing(storage, previous.coverImageKey);
  return { coverUrl: storage.publicUrl(key) };
}

async function removeWithoutUndoing(storage: CoverStorage, key: string) {
  try {
    await storage.remove(key);
  } catch (error) {
    console.warn("[capa] foto antiga não foi apagada do storage", key, error);
  }
}
