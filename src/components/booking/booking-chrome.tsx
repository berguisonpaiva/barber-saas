import type { ReactNode } from "react";
import { Check, ChevronLeft } from "lucide-react";
import { cn } from "@/shared/utils/cn";

const TOTAL_STEPS = 4;

/** Cabeçalho das telas C2–C4: voltar, título e "PASSO N DE 4". */
export function StepHeader({ step, label, title, onBack }: { step: number; label: string; title: string; onBack: () => void }) {
  return (
    <header className="flex flex-col gap-4 px-6 pt-4">
      <div className="relative flex h-11 items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="absolute left-0 grid size-11 place-items-center rounded-full border border-line bg-surface"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <h1 className="text-title-md">{title}</h1>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-overline text-fg-accent">
          Passo {step} de {TOTAL_STEPS} · {label}
        </p>
        <div className="grid grid-cols-4 gap-1" aria-hidden>
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <span key={index} className={cn("h-1 rounded-full", index < step ? "bg-accent" : "bg-muted")} />
          ))}
        </div>
      </div>
    </header>
  );
}

/** Rodapé fixo com a ação principal (e um resumo opcional acima). */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 mt-auto flex flex-col gap-3 border-t border-line bg-canvas px-6 pb-6 pt-4">{children}</div>
  );
}

/** Tela cheia de um passo do agendamento, por cima da página da barbearia. */
export function StepScreen({ children }: { children: ReactNode }) {
  return <div className="fixed inset-0 z-20 mx-auto flex max-w-md flex-col overflow-y-auto bg-canvas">{children}</div>;
}

/** Cartão de escolha (serviço ou profissional) com marcação à direita: única (radio) ou múltipla (checkbox). */
export function ChoiceCard({
  selected,
  onSelect,
  disabled = false,
  kind = "radio",
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  kind?: "radio" | "checkbox";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role={kind}
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors disabled:opacity-50",
        selected ? "border-accent bg-accent-subtle" : "border-line bg-surface",
      )}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "grid size-6 shrink-0 place-items-center border-2",
          kind === "radio" ? "rounded-full" : "rounded-sm",
          selected ? "border-accent bg-accent text-on-accent" : "border-line-strong",
        )}
      >
        {selected ? <Check className="size-4" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

/** Linha de detalhe (ícone, rótulo, valor) dentro de um <dl>: comprovante e cancelamento. */
export function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-subtle text-fg-accent">
        {icon}
      </span>
      <div className="flex flex-col">
        <dt className="text-body-sm text-fg-muted">{label}</dt>
        <dd className="text-title-sm">{value}</dd>
      </div>
    </div>
  );
}

export function Initials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-copper text-title-sm text-canvas">
      {initials}
    </span>
  );
}
