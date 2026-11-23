import type { NextRequest } from "next/server";
import { getStripe } from "@/modules/billing/infrastructure/stripe-client";
import { handleStripeEvent } from "@/modules/billing/application/use-cases/handle-stripe-webhook";

/** Webhook assinado + idempotente (PRD §12). Corpo bruto é obrigatório para verificar a assinatura. */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return new Response("Assinatura ausente.", { status: 400 });

  const payload = await req.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return new Response("Assinatura inválida.", { status: 400 });
  }

  try {
    const result = await handleStripeEvent(event);
    return Response.json({ received: true, result });
  } catch (error) {
    console.error("[stripe webhook]", event.type, error);
    return new Response("Erro ao processar.", { status: 500 }); // Stripe reenvia
  }
}
