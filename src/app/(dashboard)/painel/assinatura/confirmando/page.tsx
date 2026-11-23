import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confirmando assinatura" };

/**
 * Tela O4. O retorno do Checkout NÃO confirma pagamento (RN-02):
 * a liberação acontece só quando o webhook atualiza a assinatura.
 * TODO: consultar o status da assinatura e redirecionar quando ACTIVE/TRIALING.
 */
export default function ConfirmandoPage() {
  return (
    <main className="flex flex-col items-center gap-3 px-6 pt-32 text-center">
      <h1 className="text-display-sm">Confirmando sua assinatura…</h1>
      <p className="text-body-md text-fg-muted">
        Assim que o Stripe confirmar o pagamento, seu painel é liberado automaticamente.
      </p>
    </main>
  );
}
