import { z } from "zod";
import { optionalText } from "@/shared/forms/fields";
import { normalizeBrazilPhone } from "@/shared/utils/phone";

/** Fusos do Brasil (IANA) oferecidos no painel. */
export const BRAZIL_TIME_ZONES = [
  { id: "America/Noronha", label: "Fernando de Noronha (UTC−2)" },
  { id: "America/Sao_Paulo", label: "Brasília · SP, RJ, MG, Sul, GO, DF (UTC−3)" },
  { id: "America/Fortaleza", label: "Fortaleza · CE, RN, PB, PI, MA (UTC−3)" },
  { id: "America/Recife", label: "Recife · PE (UTC−3)" },
  { id: "America/Bahia", label: "Salvador · BA (UTC−3)" },
  { id: "America/Maceio", label: "Maceió · AL, SE (UTC−3)" },
  { id: "America/Belem", label: "Belém · PA leste, AP (UTC−3)" },
  { id: "America/Santarem", label: "Santarém · PA oeste (UTC−3)" },
  { id: "America/Araguaina", label: "Araguaína · TO (UTC−3)" },
  { id: "America/Campo_Grande", label: "Campo Grande · MS (UTC−4)" },
  { id: "America/Cuiaba", label: "Cuiabá · MT (UTC−4)" },
  { id: "America/Manaus", label: "Manaus · AM (UTC−4)" },
  { id: "America/Porto_Velho", label: "Porto Velho · RO (UTC−4)" },
  { id: "America/Boa_Vista", label: "Boa Vista · RR (UTC−4)" },
  { id: "America/Rio_Branco", label: "Rio Branco · AC (UTC−5)" },
] as const;

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Lista do painel; um fuso já salvo fora dela continua aparecendo para não ser trocado sem querer. */
export function timeZoneOptions(current: string) {
  return BRAZIL_TIME_ZONES.some((zone) => zone.id === current)
    ? BRAZIL_TIME_ZONES
    : [...BRAZIL_TIME_ZONES, { id: current, label: current }];
}

const minutesBetween = (min: number, max: number, label: string) =>
  z.coerce
    .number({ error: `Informe ${label}.` })
    .int(`Use um número inteiro para ${label}.`)
    .min(min, `Mínimo para ${label}: ${min}.`)
    .max(max, `Máximo para ${label}: ${max}.`);

/** Dados da barbearia e regras de agendamento (RF-02, RN-04). O Link de agendamento nunca muda aqui. */
export const barbeariaSettingsSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(80, "Use até 80 caracteres."),
  address: optionalText(160),
  phone: optionalText(30).transform((value, ctx) => {
    if (!value) return null;
    const normalized = normalizeBrazilPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Telefone inválido. Use DDD + número." });
      return z.NEVER;
    }
    return normalized;
  }),
  timezone: z.string({ error: "Escolha o fuso." }).refine(isValidTimeZone, "Fuso inválido."),
  slotIntervalMinutes: minutesBetween(5, 120, "a grade de horários"),
  minAdvanceMinutes: minutesBetween(0, 10_080, "a antecedência mínima"),
  maxAdvanceDays: minutesBetween(1, 365, "o limite de dias"),
  cancellationWindowMinutes: minutesBetween(0, 10_080, "a janela de cancelamento"),
});

export type BarbeariaSettingsInput = z.infer<typeof barbeariaSettingsSchema>;
