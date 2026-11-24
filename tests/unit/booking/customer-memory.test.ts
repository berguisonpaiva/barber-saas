import { describe, expect, it } from "vitest";
import { forgetCustomer, recallCustomer, rememberCustomer } from "@/components/booking/customer-memory";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

const blockedStorage = {
  getItem: () => {
    throw new DOMException("bloqueado", "SecurityError");
  },
  setItem: () => {
    throw new DOMException("cota cheia", "QuotaExceededError");
  },
  removeItem: () => {
    throw new DOMException("bloqueado", "SecurityError");
  },
};

describe("dados do cliente lembrados no aparelho", () => {
  it("o que foi lembrado volta no próximo agendamento", () => {
    const storage = memoryStorage();

    rememberCustomer({ name: "Carlos", phone: "(85) 99876-5432" }, storage);

    expect(recallCustomer(storage)).toEqual({ name: "Carlos", phone: "(85) 99876-5432" });
  });

  it("depois de esquecer, não volta nada", () => {
    const storage = memoryStorage();
    rememberCustomer({ name: "Carlos", phone: "(85) 99876-5432" }, storage);

    forgetCustomer(storage);

    expect(recallCustomer(storage)).toBeNull();
  });

  it("conteúdo corrompido ou de outro formato vale como nada lembrado", () => {
    expect([
      recallCustomer(memoryStorage({ "barber-saas:customer": "{quebrado" })),
      recallCustomer(memoryStorage({ "barber-saas:customer": JSON.stringify({ name: 1 }) })),
    ]).toEqual([null, null]);
  });

  it("armazenamento bloqueado não quebra: nada lembrado e salvar/esquecer não lançam", () => {
    expect(recallCustomer(blockedStorage)).toBeNull();
    expect(() => rememberCustomer({ name: "Carlos", phone: "85" }, blockedStorage)).not.toThrow();
    expect(() => forgetCustomer(blockedStorage)).not.toThrow();
  });

  it("fora do navegador (sem armazenamento) não lembra nada", () => {
    expect(recallCustomer(undefined)).toBeNull();
  });
});
