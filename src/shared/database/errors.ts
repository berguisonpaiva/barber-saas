/** Códigos SQLSTATE do Postgres que tratamos explicitamente. */
export const PG_EXCLUSION_VIOLATION = "23P01";
export const PG_UNIQUE_VIOLATION = "23505";

/** Procura um código SQLSTATE dentro do erro (Prisma embrulha o erro do driver). */
export function hasPgCode(error: unknown, code: string): boolean {
  const seen = new Set<unknown>();
  const stack: unknown[] = [error];
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    const record = current as Record<string, unknown>;
    if (record.code === code) return true;
    if (typeof record.message === "string" && record.message.includes(code)) return true;
    for (const key of ["cause", "meta", "originalError", "driverAdapterError"]) {
      if (key in record) stack.push(record[key]);
    }
  }
  return false;
}

/** Prisma: violação de unique (P2002). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") ||
    hasPgCode(error, PG_UNIQUE_VIOLATION)
  );
}

export const PG_FOREIGN_KEY_VIOLATION = "23503";

/** Prisma: violação de chave estrangeira (P2003) — ex.: excluir registro que ainda tem agendamentos (Restrict). */
export function isForeignKeyViolation(error: unknown): boolean {
  return (
    (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2003") ||
    hasPgCode(error, PG_FOREIGN_KEY_VIOLATION)
  );
}
