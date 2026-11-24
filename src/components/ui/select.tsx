import type { ComponentProps } from "react";
import { cn } from "@/shared/utils/cn";

type SelectProps = ComponentProps<"select"> & { label: string; helper?: string; error?: string };

/** Select nativo com a mesma moldura do Input. */
export function Select({ label, helper, error, className, id, children, ...props }: SelectProps) {
  const selectId = id ?? props.name;
  const hint = error ?? helper;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={selectId} className="text-sm font-semibold text-fg-muted">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={!!error}
        aria-describedby={hint ? `${selectId}-hint` : undefined}
        className={cn(
          "h-[54px] rounded-md border bg-surface px-4 text-body-lg text-fg outline-none focus:border-focus",
          error ? "border-danger" : "border-line",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {hint ? (
        <p id={`${selectId}-hint`} className={cn("text-body-sm", error ? "text-danger" : "text-fg-muted")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
