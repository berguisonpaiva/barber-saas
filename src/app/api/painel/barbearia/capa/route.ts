import type { NextRequest } from "next/server";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { MAX_COVER_BYTES } from "@/modules/tenants/domain/cover-image";
import { replaceBarbeariaCover } from "@/modules/tenants/application/use-cases/replace-barbearia-cover";
import { S3CoverStorage } from "@/modules/tenants/infrastructure/s3-cover-storage";
import { ValidationError } from "@/shared/errors/app-error";
import { toErrorResponse } from "@/shared/errors/http";

const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

/** Envio da foto de capa pelo proprietário. A barbearia vem da sessão, nunca do formulário (RN-01). */
export async function POST(req: NextRequest) {
  const { tenantId } = await requireOwner();
  try {
    if (Number(req.headers.get("content-length") ?? 0) > MAX_COVER_BYTES + MULTIPART_OVERHEAD_BYTES) {
      throw new ValidationError("A foto pode ter até 5 MB.");
    }
    const file = (await req.formData()).get("cover");
    if (!(file instanceof File)) throw new ValidationError("Escolha uma foto.");

    const bytes = new Uint8Array(await file.arrayBuffer());
    return Response.json(await replaceBarbeariaCover(tenantId, bytes, S3CoverStorage.fromEnv()));
  } catch (error) {
    return toErrorResponse(error);
  }
}
