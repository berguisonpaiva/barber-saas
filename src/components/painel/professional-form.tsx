"use client";

import { useFormAction } from "@/components/painel/use-form-action";
import { Button } from "@/components/ui/button";
import { CheckChip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { FormMessage } from "@/components/painel/form-message";
import type { FormState } from "@/shared/forms/form-state";

export type ProfessionalFormValues = { name: string; serviceIds: string[]; active: boolean };

type ProfessionalFormProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  services: { id: string; name: string; active: boolean }[];
  defaults: ProfessionalFormValues;
  submitLabel: string;
};

/** Tela P5 (novo/editar): profissional sem login e os serviços que executa (RF-05). */
export function ProfessionalForm({ action, services, defaults, submitLabel }: ProfessionalFormProps) {
  const { state, onSubmit, pending } = useFormAction(action);
  const errors = state?.fieldErrors;
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Input label="Nome" name="name" defaultValue={defaults.name} maxLength={60} autoComplete="off" error={errors?.name?.[0]} required />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-semibold text-fg-muted">Serviços que realiza</legend>
        {services.length ? (
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <CheckChip
                key={service.id}
                name="serviceIds"
                value={service.id}
                label={service.active ? service.name : `${service.name} (desativado)`}
                defaultChecked={defaults.serviceIds.includes(service.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-fg-muted">Cadastre serviços para vinculá-los a este profissional.</p>
        )}
      </fieldset>
      <Toggle
        label="Atendendo"
        description="Desligado, não oferece horários no link. Agendamentos já confirmados continuam valendo."
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
