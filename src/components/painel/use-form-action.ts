"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { FormState } from "@/shared/forms/form-state";

type Options = { resetOnSuccess?: boolean };

/**
 * useActionState sem o reset automático do React 19: com `<form action>`, o React limpa os campos
 * não controlados ao fim da action — inclusive quando ela devolve erro de validação, e o usuário perde o que digitou.
 * Aqui o envio passa pelo onSubmit; o formulário só é limpo em caso de sucesso, se pedido.
 */
export function useFormAction(action: (prev: FormState, formData: FormData) => Promise<FormState>, options: Options = {}) {
  const [state, dispatch, pending] = useActionState(async (prev: FormState, form: HTMLFormElement) => {
    const result = await action(prev, new FormData(form));
    if (options.resetOnSuccess && result?.success) form.reset();
    return result;
  }, undefined);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    startTransition(() => dispatch(form));
  }

  return { state, onSubmit, pending };
}
