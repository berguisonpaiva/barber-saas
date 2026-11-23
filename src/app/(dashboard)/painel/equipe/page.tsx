import type { Metadata } from "next";

export const metadata: Metadata = { title: "Equipe" };

// TODO(RF-05/RF-06 — profissionais (P5) e horários/folgas (P6/P7))
export default function Page() {
  return (
    <main className="flex flex-col gap-2 px-6 pt-6">
      <h1 className="text-display-sm">Equipe</h1>
      <p className="text-body-md text-fg-muted">Em construção.</p>
    </main>
  );
}
