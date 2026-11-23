import type { NextRequest } from "next/server";
import { processOutbox } from "@/modules/notifications/application/use-cases/process-outbox";
import { safeEqual } from "@/shared/security/token";

/** Chamado pelo cron (Coolify) a cada minuto: Authorization: Bearer $CRON_SECRET */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(header, `Bearer ${secret}`)) return new Response(null, { status: 401 });

  const result = await processOutbox();
  return Response.json(result);
}
