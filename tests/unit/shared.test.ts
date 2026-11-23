import { describe, expect, it } from "vitest";
import { formatBrazilPhone, normalizeBrazilPhone } from "@/shared/utils/phone";
import { generateToken, hashToken, randomCode } from "@/shared/security/token";
import { isValidSlug, slugify } from "@/modules/tenants/domain/slug";
import { buildPushMessage } from "@/modules/notifications/domain/messages";

describe("telefone", () => {
  it.each([
    ["(85) 99876-5432", "+5585998765432"],
    ["85998765432", "+5585998765432"],
    ["+55 85 99876-5432", "+5585998765432"],
    ["085 3333-4444", "+558533334444"],
  ])("%s → %s", (input, expected) => expect(normalizeBrazilPhone(input)).toBe(expected));

  it.each(["123", "(85) 89876-5432", "(05) 99876-5432"])("rejeita %s", (input) =>
    expect(normalizeBrazilPhone(input)).toBeNull(),
  );

  it("formata para exibição", () => expect(formatBrazilPhone("+5585998765432")).toBe("(85) 99876-5432"));
});

describe("token de cancelamento", () => {
  it("gera tokens únicos e guarda só o hash", () => {
    const a = generateToken();
    expect(a).not.toBe(generateToken());
    expect(hashToken(a)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(a)).not.toContain(a);
  });
});

describe("código curto aleatório", () => {
  it("tem o tamanho pedido e só letras minúsculas e números", () => {
    expect(randomCode(4)).toMatch(/^[a-z0-9]{4}$/);
  });

  it("não se repete em sorteios seguidos", () => {
    const codes = new Set(Array.from({ length: 200 }, () => randomCode(8)));

    expect(codes.size).toBe(200);
  });
});

describe("slug", () => {
  it("normaliza acentos", () => expect(slugify("Barbearia do João!")).toBe("barbearia-do-joao"));
  it("bloqueia rotas reservadas", () => expect(isValidSlug("painel")).toBe(false));
  it("aceita slug válido", () => expect(isValidSlug("barbearia-do-joao")).toBe(true));
});

describe("mensagens de push (PRD §11)", () => {
  it("novo agendamento no horário local", () => {
    const msg = buildPushMessage("appointment.confirmed", {
      appointmentId: "a1",
      customerName: "Carlos",
      serviceName: "Corte + Barba",
      professionalName: "Rafael",
      startsAt: "2026-11-20T18:30:00.000Z",
      timeZone: "America/Fortaleza",
    });
    expect(msg.title).toBe("Novo agendamento");
    expect(msg.body).toContain("Carlos agendou Corte + Barba");
    expect(msg.body).toContain("15h30");
    expect(msg.url).toBe("/painel/agenda/a1");
  });
});
