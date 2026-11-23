import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

const CODE_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Código curto, uniforme, com letras minúsculas e números (ex.: sufixo do link de agendamento). */
export function randomCode(length: number): string {
  return Array.from({ length }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

/** Token aleatório (URL-safe) para links de cancelamento. Mostrado ao cliente uma vez. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Só o hash vai para o banco (RN-08). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
