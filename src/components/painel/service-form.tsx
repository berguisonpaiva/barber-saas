"use client";

import { useFormAction } from "@/components/painel/use-form-action";
import { Button } from "@/components/ui/button";
import { CheckChip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { FormMessage } from "@/components/painel/form-message";
import type { FormState } from "@/shared/forms/form-state";

export type ServiceFormValues = {
  name: string;
  description: string;
  price: string;
  durationMinutes: number;
  professionalIds: string[];
  active: boolean;
};

type ServiceFormProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  professionals: { id: string; name: string; active: boolean }[];
  defaults?: ServiceFormValues;
  submitLabel: string;
};

const EMPTY: ServiceFormValues = { name: "", description: "", price: "", durationMinutes: 30, professionalIds: [], active: true };

/** Tela P4: nome, preço, duração, quem realiza e disponível online. */
export function ServiceForm({ action, professionals, defaults = EMPTY, submitLabel }: ServiceFormProps) {
  const { state, onSubmit, pending } = useFormAction(action);
  const errors = state?.fieldErrors;
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Input label="Nome do serviço" name="name" defaultValue={defaults.name} maxLength={80} error={errors?.name?.[0]} required />
      <Textarea
        label="Descrição (opcional)"
        name="description"
        defaultValue={defaults.description}
        maxLength={300}
        rows={3}
        error={errors?.description?.[0]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Preço"
          name="price"
          prefix="R$"
          inputMode="decimal"
          placeholder="45,00"
          defaultValue={defaults.price}
          error={errors?.price?.[0]}
          required
        />
        <Input
          label="Duração (min)"
          name="durationMinutes"
          type="number"
          inputMode="numeric"
          min={5}
          max={480}
          step={5}
          defaultValue={defaults.durationMinutes}
          error={errors?.durationMinutes?.[0]}
          required
        />
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-semibold text-fg-muted">Quem realiza</legend>
        {professionals.length ? (
          <div className="flex flex-wrap gap-2">
            {professionals.map((professional) => (
              <CheckChip
                key={professional.id}
                name="professionalIds"
                value={professional.id}
                label={professional.active ? professional.name : `${professional.name} (desativado)`}
                defaultChecked={defaults.professionalIds.includes(professional.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-fg-muted">Cadastre profissionais em Equipe para vinculá-los a este serviço.</p>
        )}
        {errors?.professionalIds?.[0] ? <p className="text-body-sm text-danger">{errors.professionalIds[0]}</p> : null}
      </fieldset>
      <Toggle
        label="Disponível online"
        description="Aparece no seu link de agendamento."
        name="active"
        defaultChecked={defaults.active}
      />
      <FormMessage state={state} />
      <Button type="submit" block disabled={pending}>
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
