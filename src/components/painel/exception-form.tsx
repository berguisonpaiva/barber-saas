"use client";

import { useState } from "react";
import { useFormAction } from "@/components/painel/use-form-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/painel/form-message";
import type { FormState } from "@/shared/forms/form-state";
import { cn } from "@/shared/utils/cn";

type Kind = "DAY_OFF" | "BLOCK";

const KINDS: { value: Kind; label: string; hint: string }[] = [
  { value: "DAY_OFF", label: "Folga", hint: "Dia inteiro sem atendimento." },
  { value: "BLOCK", label: "Bloqueio", hint: "Um trecho do dia. Sem horário, vale o dia inteiro." },
];

type ExceptionFormProps = { action: (prev: FormState, formData: FormData) => Promise<FormState>; today: string };

/** Tela P7: nova folga ou bloqueio numa data (RF-07). */
export function ExceptionForm({ action, today }: ExceptionFormProps) {
  const [kind, setKind] = useState<Kind>("DAY_OFF");
  const { state, onSubmit, pending } = useFormAction(action, { resetOnSuccess: true });
  const errors = state?.fieldErrors;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold text-fg-muted">Tipo</legend>
        <div className="flex rounded-full border border-line bg-canvas p-1">
          {KINDS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full text-label-md has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus",
                kind === option.value ? "bg-accent text-on-accent" : "text-fg-muted",
              )}
            >
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={kind === option.value}
                onChange={() => setKind(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
        <p className="text-body-sm text-fg-muted">{KINDS.find((option) => option.value === kind)?.hint}</p>
      </fieldset>
      <Input label="Data" name="date" type="date" min={today} defaultValue={today} error={errors?.date?.[0]} required />
      {kind === "BLOCK" ? (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Das" name="start" type="time" step={300} error={errors?.start?.[0]} />
          <Input label="Até" name="end" type="time" step={300} error={errors?.end?.[0]} />
        </div>
      ) : null}
      <Input label="Motivo (opcional)" name="reason" maxLength={120} placeholder="Ex.: consulta médica" error={errors?.reason?.[0]} />
      <FormMessage state={state} />
      <Button type="submit" size="md" block disabled={pending}>
        {pending ? "Salvando…" : kind === "DAY_OFF" ? "Adicionar folga" : "Adicionar bloqueio"}
      </Button>
    </form>
  );
}
