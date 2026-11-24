import { describe, expect, it } from "vitest";
import { serviceSchema } from "@/modules/catalog/presentation/schemas/service";
import { professionalSchema } from "@/modules/professionals/presentation/schemas/professional";
import { availabilityExceptionSchema, weeklyScheduleSchema } from "@/modules/scheduling/presentation/schemas/availability";

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
