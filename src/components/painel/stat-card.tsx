import type { ReactNode } from "react";

/** Componente "StatCard" do Figma: valor em destaque, rótulo e (opcional) variação. */
export function StatCard({ label, value, detail }: { label: string; value: string; detail?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-line bg-surface p-4">
      <span className="truncate text-body-sm text-fg-muted">{label}</span>
      <span className="truncate text-title-lg tabular-nums">{value}</span>
      {detail ? <span className="text-body-sm">{detail}</span> : null}
    </div>
  );
}
