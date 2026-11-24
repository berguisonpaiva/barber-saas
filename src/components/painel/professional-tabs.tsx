import type { Route } from "next";
import { SegmentedNav } from "@/components/painel/segmented-nav";

type Tab = "dados" | "expediente" | "folgas";

/** Abas da edição do profissional: dados (P5), expediente (P6) e folgas/bloqueios (P7). */
export function ProfessionalTabs({ professionalId, current }: { professionalId: string; current: Tab }) {
  const base = `/painel/equipe/${professionalId}`;
  return (
    <SegmentedNav
      label="Seções do profissional"
      segments={[
        { href: base as Route, label: "Dados", active: current === "dados" },
        { href: `${base}/expediente` as Route, label: "Expediente", active: current === "expediente" },
        { href: `${base}/folgas` as Route, label: "Folgas", active: current === "folgas" },
      ]}
    />
  );
}
