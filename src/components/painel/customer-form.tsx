"use client";

import { useFormAction } from "@/components/painel/use-form-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/painel/form-message";
import type { FormState } from "@/shared/forms/form-state";

type CustomerFormProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults: { name: string; phone: string };
};

export function CustomerForm({ action, defaults }: CustomerFormProps) {
  const { state, onSubmit, pending } = useFormAction(action);
  const errors = state?.fieldErrors;
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input label="Nome" name="name" defaultValue={defaults.name} maxLength={80} autoComplete="off" error={errors?.name?.[0]} required />
      <Input
        label="WhatsApp"
        name="phone"
        type="tel"
        inputMode="tel"
        prefix="+55"
        defaultValue={defaults.phone}
        error={errors?.phone?.[0]}
        required
      />
      <FormMessage state={state} />
      <Button type="submit" size="md" variant="secondary" block disabled={pending}>
        {pending ? "Salvando…" : "Salvar cliente"}
      </Button>
    </form>
  );
}
