"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { createCheckoutSession, type PlanKey } from "../../application/use-cases/create-checkout-session";

export async function startCheckoutAction(formData: FormData) {
  const { tenantId, email } = await requireOwner();
  const plan: PlanKey = formData.get("plan") === "SOLO" ? "SOLO" : "PRO";
  const url = await createCheckoutSession({ tenantId, ownerEmail: email ?? "", plan });
  redirect(url as Route); // URL externa do Stripe Checkout
}
