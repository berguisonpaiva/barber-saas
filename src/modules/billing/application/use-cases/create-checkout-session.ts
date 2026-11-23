import "server-only";
import { prisma } from "@/shared/database/prisma";
import { getStripe } from "../../infrastructure/stripe-client";

export type PlanKey = "PRO" | "SOLO";

function priceFor(plan: PlanKey): string {
  const id = plan === "PRO" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_SOLO;
  if (!id) throw new Error(`Preço do plano ${plan} não configurado.`);
  return id;
}

/** RF-03: cria a sessão do Stripe Checkout para o tenant da sessão autenticada. */
export async function createCheckoutSession(params: { tenantId: string; ownerEmail: string; plan: PlanKey }) {
  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const trialDays = Number(process.env.STRIPE_TRIAL_DAYS ?? 0);

  const existing = await prisma.subscription.findUnique({ where: { tenantId: params.tenantId } });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: params.tenantId,
    customer: existing?.stripeCustomerId,
    customer_email: existing ? undefined : params.ownerEmail,
    line_items: [{ price: priceFor(params.plan), quantity: 1 }],
    subscription_data: {
      metadata: { tenantId: params.tenantId },
      ...(trialDays > 0 && !existing ? { trial_period_days: trialDays } : {}),
    },
    metadata: { tenantId: params.tenantId },
    success_url: `${appUrl}/painel/assinatura/confirmando?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/painel/assinatura`,
  });

  if (!session.url) throw new Error("Stripe não retornou URL de checkout.");
  return session.url;
}
