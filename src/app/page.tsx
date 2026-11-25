import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Container,
  Faq,
  Features,
  FinalCta,
  HowItWorks,
  LandingFooter,
  LandingHeader,
} from "@/components/landing/landing-sections";
import { PhonePreview } from "@/components/landing/phone-preview";

export const metadata: Metadata = {
  title: { absolute: "Barber · Agendamento online para barbearias" },
  description:
    "Link de agendamento para o Instagram e o WhatsApp, agenda por profissional e aviso no celular a cada reserva.",
};

export default function Home() {
  return (
    <>
      <LandingHeader />
      <main>
        <section className="overflow-hidden py-14 lg:py-24">
          <Container className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
            <div className="flex flex-col gap-6">
              <p className="text-overline text-fg-accent">Agendamento para barbearias</p>
              <h1 className="text-display-lg lg:text-[56px] lg:leading-[1.05]">Sua agenda cheia, sem trocar mensagem.</h1>
              <p className="max-w-xl text-body-lg text-fg-muted">
                Link de agendamento para o Instagram e o WhatsApp, agenda por profissional e aviso no celular a cada
                reserva. O cliente marca sozinho, a qualquer hora.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/cadastro" className={buttonVariants({})}>
                  Criar minha barbearia
                </Link>
                <Link href="#como-funciona" className={buttonVariants({ variant: "outline" })}>
                  Ver como funciona
                </Link>
              </div>
              <p className="text-body-sm text-fg-muted">
                Já tem conta?{" "}
                <Link href="/login" className="text-fg-accent underline-offset-4 hover:underline">
                  Entrar no painel
                </Link>
              </p>
            </div>
            <PhonePreview />
          </Container>
        </section>
        <HowItWorks />
        <Features />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </>
  );
}
