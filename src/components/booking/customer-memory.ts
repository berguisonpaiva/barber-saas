export interface RememberedCustomer {
  name: string;
  phone: string;
}

type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const KEY = "barber-saas:customer";

/**
 * Nome e WhatsApp do cliente guardados só neste aparelho, para não digitar de novo no próximo agendamento.
 * Armazenamento bloqueado (navegação anônima, cota cheia) ou conteúdo inválido equivalem a "nada guardado".
 */
export function recallCustomer(storage: KeyValueStorage | undefined = browserStorage()): RememberedCustomer | null {
  try {
    const saved: unknown = JSON.parse(storage?.getItem(KEY) ?? "null");
    if (!isRememberedCustomer(saved)) return null;
    return { name: saved.name, phone: saved.phone };
  } catch {
    return null;
  }
}

export function rememberCustomer(customer: RememberedCustomer, storage: KeyValueStorage | undefined = browserStorage()): void {
  try {
    storage?.setItem(KEY, JSON.stringify({ name: customer.name, phone: customer.phone }));
  } catch {
    return;
  }
}

export function forgetCustomer(storage: KeyValueStorage | undefined = browserStorage()): void {
  try {
    storage?.removeItem(KEY);
  } catch {
    return;
  }
}

function browserStorage(): KeyValueStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function isRememberedCustomer(value: unknown): value is RememberedCustomer {
  if (typeof value !== "object" || value === null) return false;
  const { name, phone } = value as Record<string, unknown>;
  return typeof name === "string" && typeof phone === "string";
}
