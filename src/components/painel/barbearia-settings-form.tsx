"use client";

import { useFormAction } from "@/components/painel/use-form-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormMessage } from "@/components/painel/form-message";
import type { FormState } from "@/shared/forms/form-state";

export type BarbeariaSettingsValues = {
  name: string;
  address: string;
  phone: string;
  timezone: string;
  slotIntervalMinutes: number;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  cancellationWindowMinutes: number;
};

type Option = { value: number; label: string };

const SLOT_OPTIONS: Option[] = [10, 15, 20, 30, 45, 60].map((m) => ({ value: m, label: `De ${m} em ${m} min` }));
const ADVANCE_OPTIONS: Option[] = [
  { value: 0, label: "Sem antecedência" },
  { value: 30, label: "30 minutos" },
  { value: 60, label: "1 hora" },
  { value: 120, label: "2 horas" },
  { value: 240, label: "4 horas" },
  { value: 720, label: "12 horas" },
  { value: 1440, label: "1 dia" },
];
const CANCEL_OPTIONS: Option[] = [
  { value: 0, label: "Até o horário" },
  { value: 60, label: "1 hora antes" },
  { value: 120, label: "2 horas antes" },
  { value: 240, label: "4 horas antes" },
  { value: 720, label: "12 horas antes" },
  { value: 1440, label: "1 dia antes" },
  { value: 2880, label: "2 dias antes" },
];

/** Garante que o valor salvo aparece mesmo se não for um dos padrões oferecidos. */
function withCurrent(options: Option[], current: number, format: (value: number) => string): Option[] {
  return options.some((option) => option.value === current) ? options : [...options, { value: current, label: format(current) }];
}

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults: BarbeariaSettingsValues;
  timeZones: readonly { id: string; label: string }[];
  bookingUrl: string;
};

/** Dados da barbearia (RF-02) e regras de agendamento (RN-04). */
export function BarbeariaSettingsForm({ action, defaults, timeZones, bookingUrl }: Props) {
  const { state, onSubmit, pending } = useFormAction(action);
  const errors = state?.fieldErrors;
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Input label="Nome da barbearia" name="name" defaultValue={defaults.name} maxLength={80} error={errors?.name?.[0]} required />
      <Input
        label="Endereço"
        name="address"
        defaultValue={defaults.address}
        maxLength={160}
        placeholder="Rua, número · bairro, cidade"
        error={errors?.address?.[0]}
      />
      <Input
        label="Telefone / WhatsApp"
        name="phone"
        type="tel"
        inputMode="tel"
        prefix="+55"
        defaultValue={defaults.phone}
        placeholder="(85) 99876-5432"
        error={errors?.phone?.[0]}
      />
      <Input label="Link de agendamento" name="bookingUrl" value={bookingUrl} readOnly helper="O link não muda, para não quebrar o que você já divulgou." />

      <h2 className="pt-2 text-title-sm">Regras de agendamento</h2>
      <Select label="Fuso da barbearia" name="timezone" defaultValue={defaults.timezone} error={errors?.timezone?.[0]}>
        {timeZones.map((zone) => (
          <option key={zone.id} value={zone.id}>
            {zone.label}
          </option>
        ))}
      </Select>
      <Select
        label="Grade de horários"
        name="slotIntervalMinutes"
        defaultValue={defaults.slotIntervalMinutes}
        helper="De quanto em quanto tempo um horário pode começar."
        error={errors?.slotIntervalMinutes?.[0]}
      >
        {withCurrent(SLOT_OPTIONS, defaults.slotIntervalMinutes, (m) => `De ${m} em ${m} min`).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Select
        label="Antecedência mínima"
        name="minAdvanceMinutes"
        defaultValue={defaults.minAdvanceMinutes}
        helper="Quanto tempo antes do início um agendamento ainda pode ser marcado."
        error={errors?.minAdvanceMinutes?.[0]}
      >
        {withCurrent(ADVANCE_OPTIONS, defaults.minAdvanceMinutes, (m) => `${m} minutos`).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Input
        label="Limite de dias"
        name="maxAdvanceDays"
        type="number"
        inputMode="numeric"
        min={1}
        max={365}
        defaultValue={defaults.maxAdvanceDays}
        helper="Até quantos dias à frente a agenda aceita agendamentos."
        error={errors?.maxAdvanceDays?.[0]}
        required
      />
      <Select
        label="Janela de cancelamento"
        name="cancellationWindowMinutes"
        defaultValue={defaults.cancellationWindowMinutes}
        helper="Até quando o cliente pode cancelar sozinho pelo link."
        error={errors?.cancellationWindowMinutes?.[0]}
      >
        {withCurrent(CANCEL_OPTIONS, defaults.cancellationWindowMinutes, (m) => `${m} minutos antes`).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <FormMessage state={state} />
      <Button type="submit" block disabled={pending}>
        {pending ? "Salvando…" : "Salvar dados"}
      </Button>
    </form>
  );
}
