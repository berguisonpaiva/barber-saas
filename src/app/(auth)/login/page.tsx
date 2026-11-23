import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 pb-10 pt-20">
      <div className="flex flex-col gap-1">
        <p className="text-overline text-fg-accent">Painel da barbearia</p>
        <h1 className="text-display-md">Bem-vindo de volta</h1>
      </div>
      <LoginForm />
      <p className="mt-auto text-center text-body-md text-fg-muted">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-bold text-fg-accent">
          Criar minha barbearia
        </Link>
      </p>
    </main>
  );
}
