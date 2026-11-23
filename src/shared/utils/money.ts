const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 7000 → "R$ 70,00" */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}
