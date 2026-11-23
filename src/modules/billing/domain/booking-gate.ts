/**
 * RN-02: a assinatura libera o agendamento público.
 * Função pura — os estados espelham os do Stripe, sincronizados por webhook.
 */
export type SubscriptionStatusValue =
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "UNPAID"
  | "PAUSED";

export interface SubscriptionSnapshot {
  status: SubscriptionStatusValue;
  currentPeriodEnd: Date | null;
}

/** Tolerância para PAST_DUE após o fim do período pago. */
export const PAST_DUE_GRACE_DAYS = 3;

export function isBookingEnabled(sub: SubscriptionSnapshot | null, now: Date): boolean {
  if (!sub) return false;
  const periodEnd = sub.currentPeriodEnd?.getTime() ?? 0;
  switch (sub.status) {
    case "TRIALING":
    case "ACTIVE":
      return true;
    case "PAST_DUE":
      return now.getTime() <= periodEnd + PAST_DUE_GRACE_DAYS * 86_400_000;
    case "CANCELED":
      return now.getTime() <= periodEnd; // até o fim do acesso pago
    default:
      return false;
  }
}

/** Mapeia o status do Stripe para o nosso enum. */
export function mapStripeStatus(status: string): SubscriptionStatusValue {
  const map: Record<string, SubscriptionStatusValue> = {
    incomplete: "INCOMPLETE",
    incomplete_expired: "INCOMPLETE_EXPIRED",
    trialing: "TRIALING",
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "UNPAID",
    paused: "PAUSED",
  };
  return map[status] ?? "INCOMPLETE";
}
