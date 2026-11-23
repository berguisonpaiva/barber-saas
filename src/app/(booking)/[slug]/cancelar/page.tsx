import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cancelar agendamento", robots: { index: false } };

/**
 * Tela C6 do Figma. O token chega na query (?token=) e é enviado para
 * POST /api/public/[slug]/appointments/cancel. Nunca registre o token em logs.
 * TODO(RF-12): implementar confirmação e tela C7.
 */
export default function CancelPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-6 pt-16">
      <h1 className="text-display-sm">Deseja cancelar este horário?</h1>
      <p className="text-body-md text-fg-muted">Em construção.</p>
    </main>
  );
}
