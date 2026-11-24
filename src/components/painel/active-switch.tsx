"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { FormState } from "@/shared/forms/form-state";

type ActiveSwitchProps = { active: boolean; label: string; action: (active: boolean) => Promise<FormState> };

/** Interruptor ativo/desativado que salva na hora (lista de serviços e de profissionais). */
export function ActiveSwitch({ active, label, action }: ActiveSwitchProps) {
  const [optimisticActive, setOptimisticActive] = useOptimistic(active);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !optimisticActive;
    setError(undefined);
    startTransition(async () => {
      setOptimisticActive(next);
      const result = await action(next);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={optimisticActive}
        aria-label={label}
        disabled={pending}
        onClick={toggle}
        className="grid min-h-11 min-w-11 place-items-center disabled:opacity-60"
      >
        <span
          aria-hidden
          className={`relative h-7 w-12 rounded-full transition-colors ${optimisticActive ? "bg-accent" : "bg-muted"}`}
        >
          <span
            className={`absolute top-1 size-5 rounded-full transition-transform ${
              optimisticActive ? "left-1 translate-x-5 bg-on-accent" : "left-1 bg-fg"
            }`}
          />
        </span>
      </button>
      {error ? <span className="text-body-sm text-danger">{error}</span> : null}
    </span>
  );
}
