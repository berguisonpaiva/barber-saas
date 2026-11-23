/** Slugs que colidem com rotas do app. */
export const RESERVED_SLUGS = new Set([
  "api", "painel", "login", "cadastro", "admin", "app", "static", "assets",
  "_next", "manifest", "sw", "icons", "public", "termos", "privacidade", "ajuda",
]);

/** "Barbearia do João" → "barbearia-do-joao" */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const MAX_SLUG_LENGTH = 48;

/** Link de agendamento gerado no cadastro: "Barbearia do João" + "k7f3" → "barbearia-do-joao-k7f3". */
export function bookingSlugFor(shopName: string, suffix: string): string {
  const base = slugify(shopName)
    .slice(0, MAX_SLUG_LENGTH - suffix.length - 1)
    .replace(/-+$/, "");
  return `${base || "barbearia"}-${suffix}`;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/.test(slug) && !RESERVED_SLUGS.has(slug);
}
