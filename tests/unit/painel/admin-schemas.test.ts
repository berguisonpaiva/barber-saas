import { describe, expect, it } from "vitest";
import { serviceSchema } from "@/modules/catalog/presentation/schemas/service";
import { professionalSchema } from "@/modules/professionals/presentation/schemas/professional";
import { availabilityExceptionSchema, weeklyScheduleSchema } from "@/modules/scheduling/presentation/schemas/availability";
import { customerSchema } from "@/modules/customers/presentation/schemas/customer";
import {
  barbeariaSettingsSchema,
  BRAZIL_TIME_ZONES,
  timeZoneOptions,
} from "@/modules/tenants/presentation/schemas/barbearia-settings";

const service = { name: "Corte", price: "45,00", durationMinutes: "30", professionalIds: [] };

describe("formulário de serviço", () => {
  it("checkbox 'Disponível online' desmarcado (campo ausente) desativa o serviço", () => {
    expect(serviceSchema.parse(service).active).toBe(false);
  });

  it("checkbox marcado ('on') ativa o serviço", () => {
    expect(serviceSchema.parse({ ...service, active: "on" }).active).toBe(true);
  });

  it("preço com vírgula vira centavos", () => {
    expect(serviceSchema.parse({ ...service, price: "70,5" }).price).toBe(7050);
  });

  it("preço com separador de milhar vira centavos: 1.500,00 → 150000", () => {
    expect(serviceSchema.parse({ ...service, price: "1.500,00" }).price).toBe(150000);
  });

  it("preço com ponto decimal continua aceito: 40.00 → 4000", () => {
    expect(serviceSchema.parse({ ...service, price: "40.00" }).price).toBe(4000);
  });

  it("recusa preço com texto", () => {
    expect(serviceSchema.safeParse({ ...service, price: "R$ abc" }).success).toBe(false);
  });

  it("descrição vazia vira undefined", () => {
    expect(serviceSchema.parse({ ...service, description: "  " }).description).toBeUndefined();
  });

  it("recusa duração abaixo de 5 minutos", () => {
    expect(serviceSchema.safeParse({ ...service, durationMinutes: "3" }).success).toBe(false);
  });
});

describe("formulário de profissional", () => {
  it("recusa nome curto demais", () => {
    expect(professionalSchema.safeParse({ name: "A", serviceIds: [] }).success).toBe(false);
  });
});

describe("formulário de expediente", () => {
  it("converte o JSON de períodos em minutos do dia", () => {
    const periods = JSON.stringify([{ weekday: 1, start: "09:00", end: "12:30" }]);

    expect(weeklyScheduleSchema.parse({ periods }).periods).toEqual([{ weekday: 1, start: 540, end: 750 }]);
  });

  it("recusa JSON malformado com mensagem amigável", () => {
    const result = weeklyScheduleSchema.safeParse({ periods: "{" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Expediente inválido.");
  });

  it("recusa horário fora do formato HH:MM", () => {
    const periods = JSON.stringify([{ weekday: 1, start: "9h", end: "12:00" }]);

    expect(weeklyScheduleSchema.safeParse({ periods }).success).toBe(false);
  });
});

describe("formulário de folga/bloqueio", () => {
  it("horários em branco ficam ausentes (bloqueio do dia inteiro)", () => {
    const parsed = availabilityExceptionSchema.parse({ type: "BLOCK", date: "2026-11-24", start: "", end: "" });

    expect(parsed).toMatchObject({ start: undefined, end: undefined });
  });

  it("converte o trecho em minutos", () => {
    const parsed = availabilityExceptionSchema.parse({ type: "BLOCK", date: "2026-11-24", start: "14:00", end: "16:00" });

    expect(parsed).toMatchObject({ start: 840, end: 960 });
  });
});

const settings = {
  name: "Barbearia do João",
  address: "",
  phone: "",
  timezone: "America/Fortaleza",
  slotIntervalMinutes: "15",
  minAdvanceMinutes: "60",
  maxAdvanceDays: "30",
  cancellationWindowMinutes: "120",
};

describe("formulário da barbearia", () => {
  it("campos numéricos do formulário viram números e telefone vazio vira null", () => {
    expect(barbeariaSettingsSchema.parse(settings)).toMatchObject({
      phone: null,
      slotIntervalMinutes: 15,
      minAdvanceMinutes: 60,
      maxAdvanceDays: 30,
      cancellationWindowMinutes: 120,
    });
  });

  it("telefone com máscara é gravado no formato internacional", () => {
    expect(barbeariaSettingsSchema.parse({ ...settings, phone: "(85) 3333-4444" }).phone).toBe("+558533334444");
  });

  it("recusa telefone sem DDD", () => {
    const result = barbeariaSettingsSchema.safeParse({ ...settings, phone: "3333-4444" });

    expect(result.error?.issues[0]).toMatchObject({ path: ["phone"], message: "Telefone inválido. Use DDD + número." });
  });

  it("recusa fuso que não existe", () => {
    expect(barbeariaSettingsSchema.safeParse({ ...settings, timezone: "America/Atlantida" }).success).toBe(false);
  });

  it("recusa grade de horários fora de 5 a 120 minutos", () => {
    expect(barbeariaSettingsSchema.safeParse({ ...settings, slotIntervalMinutes: "4" }).success).toBe(false);
    expect(barbeariaSettingsSchema.safeParse({ ...settings, slotIntervalMinutes: "121" }).success).toBe(false);
  });

  it("um fuso salvo fora da lista do Brasil continua entre as opções", () => {
    expect(timeZoneOptions("Europe/Lisbon").at(-1)).toEqual({ id: "Europe/Lisbon", label: "Europe/Lisbon" });
    expect(timeZoneOptions("America/Fortaleza")).toBe(BRAZIL_TIME_ZONES);
  });
});

describe("formulário de cliente", () => {
  it("WhatsApp com máscara é gravado no formato internacional", () => {
    expect(customerSchema.parse({ name: "Carlos", phone: "(85) 99876-5432" }).phone).toBe("+5585998765432");
  });

  it("recusa WhatsApp inválido", () => {
    const result = customerSchema.safeParse({ name: "Carlos", phone: "123" });

    expect(result.error?.issues[0]).toMatchObject({ path: ["phone"], message: "WhatsApp inválido. Use DDD + número." });
  });
});
