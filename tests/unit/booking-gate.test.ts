import { describe, expect, it } from "vitest";
import { isBookingEnabled, mapStripeStatus } from "@/modules/billing/domain/booking-gate";

const now = new Date("2026-11-20T12:00:00Z");
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86_400_000);

describe("isBookingEnabled (RN-02)", () => {
  it("sem assinatura bloqueia", () => expect(isBookingEnabled(null, now)).toBe(false));
  it("TRIALING e ACTIVE liberam", () => {
    expect(isBookingEnabled({ status: "TRIALING", currentPeriodEnd: null }, now)).toBe(true);
    expect(isBookingEnabled({ status: "ACTIVE", currentPeriodEnd: daysFromNow(10) }, now)).toBe(true);
  });
  it("PAST_DUE libera durante a tolerância de 3 dias", () => {
    expect(isBookingEnabled({ status: "PAST_DUE", currentPeriodEnd: daysFromNow(-2) }, now)).toBe(true);
    expect(isBookingEnabled({ status: "PAST_DUE", currentPeriodEnd: daysFromNow(-4) }, now)).toBe(false);
  });
  it("CANCELED libera só até o fim do período pago", () => {
    expect(isBookingEnabled({ status: "CANCELED", currentPeriodEnd: daysFromNow(1) }, now)).toBe(true);
    expect(isBookingEnabled({ status: "CANCELED", currentPeriodEnd: daysFromNow(-1) }, now)).toBe(false);
  });
  it("UNPAID bloqueia", () => expect(isBookingEnabled({ status: "UNPAID", currentPeriodEnd: daysFromNow(5) }, now)).toBe(false));
  it("mapeia status do Stripe", () => {
    expect(mapStripeStatus("past_due")).toBe("PAST_DUE");
    expect(mapStripeStatus("desconhecido")).toBe("INCOMPLETE");
  });
});
