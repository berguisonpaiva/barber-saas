import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { startCheckoutAction } from "@/modules/billing/presentation/actions/checkout-action";

export const metadata: Metadata = { title: "Assinatura" };

const features = [
  "Agendamentos ilimitados",
  "Até 5 profissionais",
  "Link público personalizado",
  "Notificações no celular (PWA)",
  "Cancelamento pelo cliente",
];

// Preços são placeholders do protótipo — definir antes do lançamento.
export default function AssinaturaPage() {
  return (
    <main className="flex flex-col gap-4 px-6 pt-6">
      <p className="text-overline text-fg-accent">Etapa 2 de 2 · Assinatura</p>
      <h1 className="text-display-sm">Escolha seu plano</h1>
      <form action={startCheckoutAction} className="flex flex-col gap-4">
        <section className="flex flex-col gap-4 rounded-2xl border-[1.5px] border-accent bg-raised p-5 shadow-glow">
          <div className="flex items-center justify-between">
            <h2 className="text-display-sm">Plano Pro</h2>
            <Badge>14 dias grátis</Badge>
          </div>
          <p>
            <span className="text-[32px] font-extrabold">R$ 49,90</span>
            <span className="text-body-lg text-fg-muted">/mês</span>
          </p>
          <ul className="flex flex-col gap-2">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-body-md">
                <Check className="size-[18px] text-fg-accent" /> {f}
              </li>
            ))}
          </ul>
        </section>
        <input type="hidden" name="plan" value="PRO" />
        <Button type="submit" block>
          Assinar com Stripe
        </Button>
      </form>
    </main>
  );
}
