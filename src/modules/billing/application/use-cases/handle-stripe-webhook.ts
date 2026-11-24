import "server-only";
import type Stripe from "stripe";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import { mapStripeStatus } from "../../domain/booking-gate";

type WebhookResult = "processed" | "duplicate" | "ignored";

/**
 * Processa um evento JÁ VERIFICADO pela assinatura do webhook (RN-02).
 * Idempotente: o id do evento é gravado na mesma transação do processamento; repetição é ignorada
 * e, se o processamento falhar, o registro é desfeito para a nova entrega do Stripe ser processada.
 * O retorno do Checkout, sozinho, nunca ativa nada — só o webhook.
 */
export function handleStripeEvent(event: Stripe.Event): Promise<WebhookResult> {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.stripeEvent.createMany({
      data: [{ id: event.id, type: event.type }],
      skipDuplicates: true,
    });
    if (!count) return "duplicate";
    return applyEvent(tx, event);
  });
}

async function applyEvent(tx: Prisma.TransactionClient, event: Stripe.Event): Promise<WebhookResult> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const tenantId = session.client_reference_id ?? session.metadata?.tenantId;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (!tenantId || !customerId) return "ignored";
      await tx.subscription.upsert({
        where: { tenantId },
        create: { tenantId, stripeCustomerId: customerId },
        update: { stripeCustomerId: customerId },
      });
      return "processed";
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed": {
      await syncSubscription(tx, event.data.object);
      return "processed";
    }
    default:
      return "ignored";
  }
}

async function syncSubscription(tx: Prisma.TransactionClient, sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const tenantId = sub.metadata?.tenantId;
  const item = sub.items.data[0];
  const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : null;
  const status = mapStripeStatus(sub.status);

  const data = {
    stripeSubscriptionId: sub.id,
    stripePriceId: item?.price.id ?? null,
    status,
    currentPeriodEnd: periodEnd,
    trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  };

  const existing = await tx.subscription.findUnique({ where: { stripeCustomerId: customerId } });
  if (existing) {
    await tx.subscription.update({ where: { id: existing.id }, data });
  } else if (tenantId) {
    await tx.subscription.create({ data: { tenantId, stripeCustomerId: customerId, ...data } });
  } else {
    console.warn("[stripe] assinatura sem tenant associado", sub.id);
    return;
  }

  const owningTenantId = existing?.tenantId ?? tenantId!;
  if (status === "ACTIVE" || status === "TRIALING") {
    await tx.tenant.update({ where: { id: owningTenantId }, data: { status: "ACTIVE" } });
  }
}
