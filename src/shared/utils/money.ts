const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 7000 → "R$ 70,00" */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

/** 4500 → "45,00" (valor para preencher campo de preço). */
export function centsToPriceInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
