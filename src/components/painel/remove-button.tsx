"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import type { FormState } from "@/shared/forms/form-state";

/** Remoção imediata de um item pequeno de lista (ex.: folga). Erros aparecem ao lado. */
export function RemoveButton({ label, action }: { label: string; action: () => Promise<FormState> }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <span className="flex flex-col items-end">
      <button
        type="button"
        aria-label={label}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await action();
            setError(result?.error);
          })
        }
        className="grid size-11 place-items-center rounded-full text-fg-muted hover:bg-muted disabled:opacity-50"
      >
        <X className="size-5" aria-hidden />
      </button>
      {error ? <span className="text-body-sm text-danger">{error}</span> : null}
    </span>
  );
}
