import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

type InputProps = ComponentProps<"input"> & {
  label: string;
  prefix?: ReactNode;
  helper?: string;
  error?: string;
};

/** Componente "Input" do Figma: rótulo, prefixo opcional, mensagem de apoio/erro. */
export function Input({ label, prefix, helper, error, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  const hint = error ?? helper;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-semibold text-fg-muted">
        {label}
      </label>
      <div
        className={cn(
          "flex h-[54px] items-center gap-2 rounded-md border bg-surface px-4 focus-within:border-focus",
          error ? "border-danger" : "border-line",
          className,
        )}
      >
        {prefix ? <span className="text-body-lg text-fg-muted">{prefix}</span> : null}
        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={hint ? `${inputId}-hint` : undefined}
          className="h-full w-full bg-transparent text-body-lg text-fg outline-none placeholder:text-fg-disabled"
          {...props}
        />
      </div>
      {hint ? (
        <p id={`${inputId}-hint`} className={cn("text-body-sm", error ? "text-danger" : "text-fg-muted")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
