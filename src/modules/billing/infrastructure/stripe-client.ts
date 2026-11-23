import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Instância lazy: o build não quebra se a chave não estiver configurada. */
export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY não configurada.");
    client = new Stripe(key);
  }
  return client;
}
