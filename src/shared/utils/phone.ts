/**
 * Normaliza telefone brasileiro para E.164 (+55DDXXXXXXXXX).
 * Aceita "(85) 99876-5432", "85998765432", "+55 85 99876-5432" etc.
 * Retorna null quando não parece um número BR válido (fixo ou celular).
 */
export function normalizeBrazilPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length !== 10 && digits.length !== 11) return null;

  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99 || ddd % 10 === 0) return null; // DDDs válidos: 11–99, nenhum termina em 0
  const first = digits[2];
  if (digits.length === 11 && first !== "9") return null; // celular: 9 + 8 dígitos
  if (digits.length === 10 && !"2345".includes(first)) return null; // fixo começa com 2–5

  return `+55${digits}`;
}

/** +5585998765432 → (85) 99876-5432 */
export function formatBrazilPhone(e164: string): string {
  const d = e164.replace(/^\+55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return e164;
}
