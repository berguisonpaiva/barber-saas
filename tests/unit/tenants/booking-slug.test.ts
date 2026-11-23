import { describe, expect, it } from "vitest";
import { bookingSlugFor, isValidSlug } from "@/modules/tenants/domain/slug";

describe("Link de agendamento gerado no cadastro", () => {
  it("é o nome da barbearia seguido do sufixo sorteado", () => {
    expect(bookingSlugFor("Barbearia do João", "k7f3")).toBe("barbearia-do-joao-k7f3");
  });

  it("um nome longo é encurtado para o link caber no limite e continuar válido", () => {
    const slug = bookingSlugFor("Barbearia e Salão de Beleza Masculina do Bairro Aldeota Fortaleza", "k7f3");

    expect(slug.length).toBeLessThanOrEqual(48);
    expect(slug.endsWith("-k7f3")).toBe(true);
    expect(isValidSlug(slug)).toBe(true);
  });

  it("um nome sem letras nem números vira 'barbearia' + sufixo", () => {
    expect(bookingSlugFor("★ ★ ★", "k7f3")).toBe("barbearia-k7f3");
  });

  it("um nome que seria rota reservada continua válido por causa do sufixo", () => {
    const slug = bookingSlugFor("Painel", "k7f3");

    expect(slug).toBe("painel-k7f3");
    expect(isValidSlug(slug)).toBe(true);
  });

  it("não termina com hífen quando o corte cai num espaço", () => {
    const slug = bookingSlugFor(`${"a".repeat(42)} bcd`, "k7f3");

    expect(slug).not.toMatch(/--/);
    expect(isValidSlug(slug)).toBe(true);
  });
});
