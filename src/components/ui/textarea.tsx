import type { ComponentProps } from "react";
import { cn } from "@/shared/utils/cn";

type TextareaProps = ComponentProps<"textarea"> & { label: string; helper?: string; error?: string };

export function Textarea({ label, helper, error, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;
  const hint = error ?? helper;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={textareaId} className="text-sm font-semibold text-fg-muted">
        {label}
      </label>
      <textarea
        id={textareaId}
        aria-invalid={!!error}
        aria-describedby={hint ? `${textareaId}-hint` : undefined}
        className={cn(
          "min-h-24 rounded-md border bg-surface px-4 py-3 text-body-lg text-fg outline-none placeholder:text-fg-disabled focus:border-focus",
          error ? "border-danger" : "border-line",
          className,
        )}
        {...props}
      />
      {hint ? (
        <p id={`${textareaId}-hint`} className={cn("text-body-sm", error ? "text-danger" : "text-fg-muted")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
