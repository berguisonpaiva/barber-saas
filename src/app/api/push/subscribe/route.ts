import type { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  registerPushSubscription,
  removePushSubscription,
} from "@/modules/notifications/application/use-cases/manage-push-subscription";
import { pushSubscriptionSchema } from "@/modules/notifications/presentation/schemas/push-subscription";
import { toErrorResponse } from "@/shared/errors/http";

async function ownerOrNull() {
  const session = await auth();
  return session?.user?.tenantId ? { tenantId: session.user.tenantId, ownerId: session.user.id } : null;
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await ownerOrNull();
    if (!ctx) return new Response(null, { status: 401 });
    const sub = pushSubscriptionSchema.parse(await req.json());
    await registerPushSubscription(ctx, sub, req.headers.get("user-agent"));
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await ownerOrNull();
    if (!ctx) return new Response(null, { status: 401 });
    const { endpoint } = z.object({ endpoint: z.url() }).parse(await req.json());
    await removePushSubscription(ctx, endpoint);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
