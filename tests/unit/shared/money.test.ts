import { describe, expect, it } from "vitest";
import { centsToPriceInput, maskPriceInput } from "@/shared/utils/money";

describe("máscara do campo de preço", () => {
  it.each([
    ["3", "0,03"],
    ["35", "0,35"],
    ["350", "3,50"],
    ["3500", "35,00"],
    ["150000", "1.500,00"],
  ])("digitando %s mostra %s", (typed, shown) => {
    expect(maskPriceInput(typed)).toBe(shown);
  });

  it("apagar o último dígito de 35,00 volta para 3,50", () => {
    expect(maskPriceInput("35,0")).toBe("3,50");
  });

  it("ignora letras, símbolo de moeda e zeros à esquerda", () => {
    expect(maskPriceInput("R$ 0045,00")).toBe("45,00");
  });

  it("campo vazio ou só com zeros fica vazio", () => {
    expect([maskPriceInput(""), maskPriceInput("0,00")]).toEqual(["", ""]);
  });

  it("não passa de 99.999,99", () => {
    expect(maskPriceInput("99.999,999")).toBe("99.999,99");
  });
});

describe("preço salvo preenchendo o campo", () => {
  it("usa separador de milhar: 150000 centavos → 1.500,00", () => {
    expect(centsToPriceInput(150000)).toBe("1.500,00");
  });

  it("4500 centavos → 45,00", () => {
    expect(centsToPriceInput(4500)).toBe("45,00");
  });
});
