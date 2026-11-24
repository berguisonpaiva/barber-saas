import type { ComponentProps } from "react";

type ToggleProps = Omit<ComponentProps<"input">, "type"> & { label: string; description?: string };

/** Componente "Toggle" do Figma: checkbox nativo com aparência de interruptor (envia "on" quando ligado). */
export function Toggle({ label, description, id, ...props }: ToggleProps) {
  const inputId = id ?? props.name;
  return (
    <label htmlFor={inputId} className="flex min-h-11 cursor-pointer items-center gap-4">
      <span className="flex flex-1 flex-col">
        <span className="text-title-sm">{label}</span>
        {description ? <span className="text-body-sm text-fg-muted">{description}</span> : null}
      </span>
      <input id={inputId} type="checkbox" role="switch" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-muted transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-focus after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-fg after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-on-accent"
      />
    </label>
  );
}
