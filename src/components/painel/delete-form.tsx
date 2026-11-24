"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmSubmit } from "@/components/painel/confirm-submit";
import { FormMessage } from "@/components/painel/form-message";
import type { FormState } from "@/shared/forms/form-state";

type DeleteFormProps = { action: () => Promise<FormState>; label: string; confirmLabel: string };

/** Exclusão em dois toques, com o erro do servidor (ex.: tem histórico) exibido no lugar. */
export function DeleteForm({ action, label, confirmLabel }: DeleteFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <ConfirmSubmit variant="danger" size="md" block disabled={pending} confirmLabel={confirmLabel}>
        <Trash2 aria-hidden />
        {label}
      </ConfirmSubmit>
      <FormMessage state={state} />
    </form>
  );
}
