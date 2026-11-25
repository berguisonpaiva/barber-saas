import Link from "next/link";
import type { ReactNode } from "react";
import { BellRing, CalendarDays, ChartColumn, ChevronDown, Link2, Scissors } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";

const STEPS = [
  { title: "Cadastre a barbearia", text: "Serviços com preço e duração, a equipe e o expediente de cada profissional." },
  { title: "Divulgue o seu link", text: "Coloque na bio do Instagram, no status do WhatsApp e onde mais o cliente te encontra." },
  { title: "Receba os agendamentos", text: "O cliente escolhe serviços, profissional e horário. Você é avisado no celular." },
];

const FEATURES = [
  { icon: Link2, title: "Link de agendamento", text: "Página da barbearia com os serviços; o cliente agenda sem baixar app nem criar conta." },
  { icon: CalendarDays, title: "Agenda por profissional", text: "Expediente, intervalos, folgas e bloqueios. Horário ocupado nunca é marcado duas vezes." },
  { icon: BellRing, title: "Aviso no celular", text: "Notificação a cada novo agendamento ou cancelamento, direto no painel instalado." },
  { icon: ChartColumn, title: "Resumo do movimento", text: "Faturamento, faltas, serviços mais pedidos e horários de pico dos últimos dias." },
];

const QUESTIONS = [
  { question: "O cliente precisa baixar aplicativo ou criar conta?", answer: "Não. Ele abre o link da barbearia, escolhe serviços, profissional e horário, e informa só nome e WhatsApp." },
  { question: "Funciona com mais de um barbeiro?", answer: "Sim. Cada profissional tem os serviços que realiza, o próprio expediente, folgas e bloqueios, e o cliente escolhe com quem quer ser atendido." },
  { question: "O cliente pode marcar mais de um serviço?", answer: "Pode. Ele marca, por exemplo, corte e barba no mesmo horário; a duração e o valor são somados." },
  { question: "Como fico sabendo de um novo agendamento?", answer: "Pelo aviso no celular: instale o painel na tela inicial e ative as notificações." },
  { question: "E se o cliente precisar cancelar?", answer: "O comprovante traz um link de cancelamento que vale até o prazo que você definir. O horário volta a ficar livre na hora." },
  { question: "O pagamento é feito pelo site?", answer: "Não. O cliente paga o serviço na barbearia, como sempre; o site cuida só do agendamento." },
];

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-6 lg:px-8", className)}>{children}</div>;
}

export function Brand() {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-accent text-on-accent">
        <Scissors className="size-[18px]" />
      </span>
      <span className="text-title-md">Barber</span>
    </span>
  );
}

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Barber, início">
          <Brand />
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "md" })}>
            Entrar
          </Link>
          <Link href="/cadastro" className={buttonVariants({ size: "md" })}>
            Criar conta
          </Link>
        </nav>
      </Container>
    </header>
  );
}

function SectionTitle({ overline, title, text }: { overline: string; title: string; text?: string }) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <p className="text-overline text-fg-accent">{overline}</p>
      <h2 className="text-display-md lg:text-display-lg">{title}</h2>
      {text ? <p className="text-body-lg text-fg-muted">{text}</p> : null}
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-line py-16 lg:py-24">
      <Container className="flex flex-col gap-10">
        <SectionTitle overline="Como funciona" title="Pronto para receber agendamentos em poucos minutos." />
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6">
              <span className="grid size-10 place-items-center rounded-full bg-accent-subtle text-title-md text-fg-accent">
                {index + 1}
              </span>
              <h3 className="text-title-lg">{step.title}</h3>
              <p className="text-body-md text-fg-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export function Features() {
  return (
    <section id="recursos" className="border-t border-line py-16 lg:py-24">
      <Container className="flex flex-col gap-10">
        <SectionTitle
          overline="Recursos"
          title="Tudo o que a barbearia precisa para a agenda andar sozinha."
          text="Sem planilha, sem caderno e sem responder mensagem para combinar horário."
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6">
              <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-muted text-fg-accent">
                <Icon className="size-5" />
              </span>
              <h3 className="text-title-md">{title}</h3>
              <p className="text-body-md text-fg-muted">{text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function Faq() {
  return (
    <section id="perguntas" className="border-t border-line py-16 lg:py-24">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <SectionTitle overline="Perguntas frequentes" title="Ficou alguma dúvida?" />
        <div className="flex flex-col gap-3">
          {QUESTIONS.map(({ question, answer }) => (
            <details key={question} className="group rounded-2xl border border-line bg-surface">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-title-sm [&::-webkit-details-marker]:hidden">
                {question}
                <ChevronDown aria-hidden className="size-5 shrink-0 text-fg-muted transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 text-body-md text-fg-muted">{answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="py-16 lg:py-24">
      <Container>
        <div className="flex flex-col items-center gap-6 rounded-3xl border border-line bg-surface px-6 py-12 text-center lg:py-16">
          <h2 className="max-w-xl text-display-md lg:text-display-lg">Deixe o link trabalhar por você.</h2>
          <p className="max-w-lg text-body-lg text-fg-muted">
            Crie a barbearia, cadastre os serviços e divulgue o link hoje mesmo.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/cadastro" className={buttonVariants({})}>
              Criar minha barbearia
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline" })}>
              Já tenho conta
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-line py-8">
      <Container className="flex flex-col items-center justify-between gap-4 text-body-sm text-fg-muted sm:flex-row">
        <Brand />
        <p>Barber · Agendamento online para barbearias</p>
      </Container>
    </footer>
  );
}
