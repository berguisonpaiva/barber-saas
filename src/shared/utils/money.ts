const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const priceInput = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MAX_PRICE_DIGITS = 7;

/** 7000 → "R$ 70,00" */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

/** 150000 → "1.500,00" (valor para preencher campo de preço). */
export function centsToPriceInput(cents: number): string {
  return priceInput.format(cents / 100);
}

/** Máscara do campo de preço: os dígitos digitados são os centavos, da direita para a esquerda ("3500" → "35,00"). */
export function maskPriceInput(typed: string): string {
  const cents = Number(typed.replace(/\D/g, "").slice(0, MAX_PRICE_DIGITS));
  if (!cents) return "";
  return centsToPriceInput(cents);
}
