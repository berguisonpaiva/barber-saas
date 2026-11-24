import { randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/shared/database/prisma";

const url = process.env.DATABASE_URL_TEST;

const eventId = () => `evt_${randomUUID().replaceAll("-", "")}`;

function checkoutCompleted(tenantId: string, customerId: string, id = eventId()): Stripe.Event {
  return {
    id,
    type: "checkout.session.completed",
    data: { object: { client_reference_id: tenantId, customer: customerId, metadata: {} } },
  } as unknown as Stripe.Event;
}

function subscriptionEvent(
  type: "customer.subscription.created" | "customer.subscription.updated",
  customerId: string,
  status: string,
  metadata: Record<string, string> = {},
): Stripe.Event {
  return {
    id: eventId(),
    type,
    data: {
      object: {
        id: `sub_${randomUUID().slice(0, 12)}`,
        customer: customerId,
        status,
        metadata,
        trial_end: null,
        cancel_at_period_end: false,
        items: { data: [{ price: { id: "price_pro" }, current_period_end: 1_900_000_000 }] },
      },
    },
  } as unknown as Stripe.Event;
}

describe.skipIf(!url)("webhook do Stripe (Postgres)", () => {
  let prisma: PrismaClient;
  let handleStripeEvent: typeof import("@/modules/billing/application/use-cases/handle-stripe-webhook").handleStripeEvent;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    ({ prisma } = await import("@/shared/database/prisma"));
    ({ handleStripeEvent } = await import("@/modules/billing/application/use-cases/handle-stripe-webhook"));
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  const newTenant = () =>
    prisma.tenant.create({
      data: { name: "Barbearia Stripe", slug: `stripe-${randomUUID().slice(0, 8)}`, status: "ONBOARDING" },
      select: { id: true },
    });
  const stripeCustomer = () => `cus_${randomUUID().slice(0, 12)}`;

  it("o checkout concluído só vincula o cliente do Stripe; não ativa a barbearia", async () => {
    const { id: tenantId } = await newTenant();
    const customerId = stripeCustomer();

    expect(await handleStripeEvent(checkoutCompleted(tenantId, customerId))).toBe("processed");

    const subscription = await prisma.subscription.findUniqueOrThrow({ where: { tenantId } });
    expect(subscription).toMatchObject({ stripeCustomerId: customerId, status: "INCOMPLETE" });
    expect((await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } })).status).toBe("ONBOARDING");
  });

  it("assinatura ativa ativa a barbearia e guarda plano e fim do período", async () => {
    const { id: tenantId } = await newTenant();
    const customerId = stripeCustomer();
    await handleStripeEvent(checkoutCompleted(tenantId, customerId));

    await handleStripeEvent(subscriptionEvent("customer.subscription.created", customerId, "active"));

    const subscription = await prisma.subscription.findUniqueOrThrow({ where: { tenantId } });
    expect(subscription).toMatchObject({ status: "ACTIVE", stripePriceId: "price_pro" });
    expect(subscription.currentPeriodEnd).toEqual(new Date(1_900_000_000 * 1000));
    expect((await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } })).status).toBe("ACTIVE");
  });

  it("assinatura que chega antes do checkout usa o tenant dos metadados", async () => {
    const { id: tenantId } = await newTenant();

    await handleStripeEvent(subscriptionEvent("customer.subscription.created", stripeCustomer(), "trialing", { tenantId }));

    expect((await prisma.subscription.findUniqueOrThrow({ where: { tenantId } })).status).toBe("TRIALING");
    expect((await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } })).status).toBe("ACTIVE");
  });

  it("o mesmo evento entregue duas vezes é processado uma vez só", async () => {
    const { id: tenantId } = await newTenant();
    const event = checkoutCompleted(tenantId, stripeCustomer());

    expect(await handleStripeEvent(event)).toBe("processed");
    expect(await handleStripeEvent(event)).toBe("duplicate");
    expect(await prisma.stripeEvent.count({ where: { id: event.id } })).toBe(1);
  });

  it("evento de tipo que não tratamos é registrado e ignorado", async () => {
    const event = { id: eventId(), type: "invoice.paid", data: { object: {} } } as unknown as Stripe.Event;

    expect(await handleStripeEvent(event)).toBe("ignored");
    expect(await prisma.stripeEvent.count({ where: { id: event.id } })).toBe(1);
  });

  it("se o processamento falhar, o evento não fica marcado e a nova entrega do Stripe é processada", async () => {
    const { id: tenantId } = await newTenant();
    const id = eventId();
    const customerId = stripeCustomer();

    await expect(handleStripeEvent(checkoutCompleted(randomUUID(), customerId, id))).rejects.toThrow();
    expect(await prisma.stripeEvent.count({ where: { id } })).toBe(0);

    expect(await handleStripeEvent(checkoutCompleted(tenantId, customerId, id))).toBe("processed");
    expect((await prisma.subscription.findUniqueOrThrow({ where: { tenantId } })).stripeCustomerId).toBe(customerId);
  });
});
