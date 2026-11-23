"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/modules/identity/presentation/actions/auth-actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label="E-mail" name="email" type="email" autoComplete="email" required />
      <Input label="Senha" name="password" type="password" autoComplete="current-password" required />
      {state?.error ? <p className="text-body-md text-danger">{state.error}</p> : null}
      <Button type="submit" block disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
