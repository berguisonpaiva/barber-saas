import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 pb-10 pt-16">
      <h1 className="text-display-md">Criar conta</h1>
      <RegisterForm />
    </main>
  );
}
