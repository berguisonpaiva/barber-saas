import type { ComponentProps } from "react";

type CheckChipProps = Omit<ComponentProps<"input">, "type"> & { label: string };

/** Componente "Chip" do Figma como seleção múltipla: checkbox nativo, selecionado em dourado. */
export function CheckChip({ label, ...props }: CheckChipProps) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-label-md text-fg-muted transition-colors peer-checked:border-accent peer-checked:bg-accent-subtle peer-checked:text-fg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-focus">
        {label}
      </span>
    </label>
  );
}
