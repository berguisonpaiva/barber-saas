import { z } from "zod";
import { NotFoundError } from "@/shared/errors/app-error";

/** Id vindo do navegador: só é aceito se for UUID; o escopo da barbearia é garantido na consulta. */
export function parseEntityId(value: unknown, notFoundMessage: string): string {
  const parsed = z.uuid().safeParse(value);
  if (!parsed.success) throw new NotFoundError(notFoundMessage);
  return parsed.data;
}
