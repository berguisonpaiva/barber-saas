import { z } from "zod";

/** Retorno padrão das Server Actions de formulário (consumido por useActionState). */
export type FormState =
  | { fieldErrors?: Record<string, string[] | undefined>; error?: string; success?: string }
  | undefined;

export function invalidForm(error: z.ZodError): FormState {
  return { fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined> };
}
