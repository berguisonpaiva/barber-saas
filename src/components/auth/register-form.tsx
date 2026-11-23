"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerAction } from "@/modules/identity/presentation/actions/auth-actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, undefined);
  const fe = state?.fieldErrors;
  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-overline text-fg-accent">Etapa 1 de 2 · Seus dados</p>
      <Input label="Nome completo" name="ownerName" autoComplete="name" error={fe?.ownerName?.[0]} required />
      <Input label="E-mail" name="email" type="email" autoComplete="email" error={fe?.email?.[0]} required />
      <Input label="Senha" name="password" type="password" autoComplete="new-password" error={fe?.password?.[0]} required />
      <Input label="Nome da barbearia" name="shopName" error={fe?.shopName?.[0]} required />
      {state?.error ? <p className="text-body-md text-danger">{state.error}</p> : null}
      <Button type="submit" block disabled={pending}>
        {pending ? "Criando…" : "Continuar para o plano"}
      </Button>
    </form>
  );
}
