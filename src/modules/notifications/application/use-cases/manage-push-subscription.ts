import "server-only";
import { prisma } from "@/shared/database/prisma";

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** RF-13: vincula o dispositivo ao proprietário e ao tenant da SESSÃO. */
export async function registerPushSubscription(
  ctx: { tenantId: string; ownerId: string },
  sub: PushSubscriptionInput,
  userAgent?: string | null,
) {
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: {
      tenantId: ctx.tenantId,
      ownerId: ctx.ownerId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent: userAgent ?? null,
    },
    update: {
      tenantId: ctx.tenantId,
      ownerId: ctx.ownerId,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      enabled: true,
      failureCount: 0,
    },
  });
}

export async function removePushSubscription(ctx: { tenantId: string }, endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { tenantId: ctx.tenantId, endpoint } });
}
