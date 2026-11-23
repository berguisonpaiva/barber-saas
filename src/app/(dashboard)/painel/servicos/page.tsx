import type { Metadata } from "next";

export const metadata: Metadata = { title: "Serviços" };

// TODO(RF-04 — lista com ativar/desativar (tela P3) e novo serviço (P4, createServiceAction))
export default function Page() {
  return (
    <main className="flex flex-col gap-2 px-6 pt-6">
      <h1 className="text-display-sm">Serviços</h1>
      <p className="text-body-md text-fg-muted">Em construção.</p>
    </main>
  );
}
