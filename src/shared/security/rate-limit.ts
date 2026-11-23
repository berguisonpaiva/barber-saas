import "server-only";
import { prisma } from "@/shared/database/prisma";
import { TooManyRequestsError } from "@/shared/errors/app-error";

/**
 * Rate limit de janela fixa guardado no Postgres (RN-10, sem Redis no MVP).
 * Operação atômica: um único INSERT … ON CONFLICT.
 */
export async function assertRateLimit(key: string, limit: number, windowSeconds: number) {
  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimitBucket"."resetAt" < now() THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" < now() THEN EXCLUDED."resetAt" ELSE "RateLimitBucket"."resetAt" END
    RETURNING "count", "resetAt"
  `;
  const row = rows[0];
  if (row && row.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000));
    throw new TooManyRequestsError(retryAfter);
  }
}

/** IP do cliente atrás do proxy (Coolify/Traefik). */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
