import type { ReactNode } from "react";

/** Estado vazio de listas do painel: ícone, título e orientação do próximo passo. */
export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong p-8 text-center">
      <span className="text-fg-muted [&_svg]:size-8">{icon}</span>
      <p className="text-title-sm">{title}</p>
      <p className="text-body-sm text-fg-muted">{text}</p>
    </section>
  );
}
