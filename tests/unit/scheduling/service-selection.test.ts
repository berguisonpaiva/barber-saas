import { describe, expect, it } from "vitest";
import { combineServices, parseServiceSelection } from "@/modules/scheduling/domain/service-selection";
import { ValidationError } from "@/shared/errors/app-error";

const corte = { id: "corte", name: "Corte", priceCents: 3500, durationMinutes: 30 };
const barba = { id: "barba", name: "Barba", priceCents: 2500, durationMinutes: 20 };

describe("escolha de serviços do agendamento", () => {
  it("mantém a ordem escolhida e descarta repetição", () => {
    expect(parseServiceSelection(["barba", "corte", "barba"])).toEqual(["barba", "corte"]);
  });

  it("exige ao menos um serviço", () => {
    expect(() => parseServiceSelection([])).toThrow(ValidationError);
  });

  it("aceita 5 serviços", () => {
    expect(parseServiceSelection(["a", "b", "c", "d", "e"])).toHaveLength(5);
  });

  it("recusa o 6º serviço", () => {
    expect(() => parseServiceSelection(["a", "b", "c", "d", "e", "f"])).toThrow("Escolha até 5 serviços por agendamento.");
  });
});

describe("serviços combinados num atendimento", () => {
  it("Corte + Barba: nome na ordem escolhida, preço e duração somados", () => {
    expect(combineServices([corte, barba])).toEqual({
      services: [corte, barba],
      name: "Corte + Barba",
      priceCents: 6000,
      durationMinutes: 50,
    });
  });

  it("um serviço só fica igual ao próprio serviço", () => {
    expect(combineServices([corte])).toMatchObject({ name: "Corte", priceCents: 3500, durationMinutes: 30 });
  });
});
