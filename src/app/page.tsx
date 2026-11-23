import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-end gap-6 px-6 pb-12 pt-24">
      <p className="text-overline text-fg-accent">Agendamento para barbearias</p>
      <h1 className="text-display-lg">Sua agenda cheia, sem trocar mensagem.</h1>
      <p className="text-body-lg text-fg-muted">
        Link de agendamento para o Instagram e WhatsApp, agenda por profissional e aviso no celular a cada reserva.
      </p>
      <div className="flex flex-col gap-3">
        <Link href="/cadastro" className={buttonVariants({ block: true })}>
          Criar minha barbearia
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline", block: true })}>
          Já tenho conta
        </Link>
      </div>
    </main>
  );
}
