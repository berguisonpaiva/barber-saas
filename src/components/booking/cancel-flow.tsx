"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, Info, Scissors, TriangleAlert, UserRound, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { BottomBar, DetailRow } from "./booking-chrome";
import { slotSummary, spokenDateTime, windowLabel } from "./booking-labels";

export interface CancelLinkDetails {
  customerName: string;
  serviceName: string;
  professionalName: string;
  startsAt: string;
  timeZone: string;
  cancellationWindowMinutes: number;
  state: "cancellable" | "window-closed" | "canceled";
}

/** Telas C6 (confirmar cancelamento) e C7 (cancelamento concluído). */
export function CancelFlow({ slug, token, details }: { slug: string; token: string; details: CancelLinkDetails }) {
  const [canceled, setCanceled] = useState(details.state === "canceled");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startsAt = new Date(details.startsAt);

  async function cancel() {
    setSending(true);
    setError(null);
    const response = await fetch(`/api/public/${encodeURIComponent(slug)}/appointments/cancel`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => null);
    const body = await response?.json().catch(() => null);
    if (response?.ok) return setCanceled(true);
    setError(body?.error?.message ?? "Não foi possível cancelar agora. Tente de novo.");
    setSending(false);
  }

  if (canceled) return <Canceled slug={slug} when={spokenDateTime(startsAt, details.timeZone)} />;

  const windowOpen = details.state === "cancellable";
  return (
    <>
      <header className="relative flex h-11 items-center justify-center px-6 pt-4">
        <Link
          href={`/${slug}`}
          aria-label="Voltar para a barbearia"
          className="absolute left-6 grid size-11 place-items-center rounded-full border border-line bg-surface"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="text-title-md">Cancelar agendamento</h1>
      </header>
      <section className="flex flex-col gap-5 px-6 pb-6 pt-8">
        <span className="grid size-16 place-items-center rounded-full bg-danger-subtle text-danger">
          <TriangleAlert className="size-7" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="text-display-sm">Deseja cancelar este horário?</h2>
          <p className="text-body-md text-fg-muted">Olá, {details.customerName}. Confira os dados antes de confirmar.</p>
        </div>
        <dl className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
          <DetailRow icon={<Scissors className="size-5" />} label="Serviço" value={details.serviceName} />
          <DetailRow icon={<UserRound className="size-5" />} label="Profissional" value={details.professionalName} />
          <DetailRow icon={<CalendarDays className="size-5" />} label="Data e horário" value={slotSummary(startsAt, details.timeZone)} />
        </dl>
        <p
          className={cn(
            "flex gap-3 rounded-2xl px-4 py-3 text-body-sm",
            windowOpen ? "bg-accent-subtle text-fg" : "bg-danger-subtle text-danger",
          )}
        >
          <Info className={cn("mt-0.5 size-5 shrink-0", windowOpen ? "text-fg-accent" : null)} aria-hidden />
          {windowOpen
            ? `Cancelamento gratuito até ${windowLabel(details.cancellationWindowMinutes)} antes. Depois de cancelado, o horário volta a ficar disponível para outros clientes.`
            : `O cancelamento online só vale até ${windowLabel(details.cancellationWindowMinutes)} antes do horário. Fale com a barbearia.`}
        </p>
        {error ? (
          <p role="alert" className="text-body-sm text-danger">
            {error}
          </p>
        ) : null}
      </section>
      <BottomBar>
        {windowOpen ? (
          <Button variant="danger" block onClick={cancel} disabled={sending}>
            {sending ? "Cancelando…" : "Sim, cancelar agendamento"}
          </Button>
        ) : null}
        <Link href={`/${slug}`} className={buttonVariants({ variant: "outline", block: true })}>
          Manter agendamento
        </Link>
      </BottomBar>
    </>
  );
}

function Canceled({ slug, when }: { slug: string; when: string }) {
  return (
    <>
      <section className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-muted text-fg-muted">
          <X className="size-7" aria-hidden />
        </span>
        <h1 className="text-display-sm">Agendamento cancelado</h1>
        <p className="text-body-md text-fg-muted">
          Seu horário de {when} foi cancelado e a barbearia já foi avisada.
        </p>
      </section>
      <BottomBar>
        <Link href={`/${slug}`} className={buttonVariants({ block: true })}>
          Agendar novo horário
        </Link>
      </BottomBar>
    </>
  );
}
