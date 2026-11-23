"use client";

import { CalendarDays, Check, MapPin, Scissors, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/shared/utils/money";
import type { BookableProfessional, BookableService, BookingConfirmation } from "./booking-api";
import { BottomBar, DetailRow, StepScreen } from "./booking-chrome";
import { calendarEvent, reservationCode, slotSummary } from "./booking-labels";

/** Tela C5 · Comprovante. */
export function ReceiptStep(props: {
  shopName: string;
  address: string | null;
  service: BookableService;
  professional: BookableProfessional;
  confirmation: BookingConfirmation;
  timeZone: string;
}) {
  const { shopName, address, service, professional, confirmation, timeZone } = props;
  const startsAt = new Date(confirmation.startsAt);

  function addToCalendar() {
    const ics = calendarEvent({
      id: confirmation.appointmentId,
      title: `${service.name} · ${shopName}`,
      startsAt,
      endsAt: new Date(confirmation.endsAt),
      location: address,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: "agendamento.ics" });
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <StepScreen>
      <main className="flex flex-col items-center gap-6 px-6 pb-6 pt-12 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-success-subtle text-success">
          <Check className="size-9" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-display-sm">Agendamento confirmado!</h1>
          <p className="text-body-md text-fg-muted">Te esperamos na {shopName}. Guarde este comprovante.</p>
        </div>
        <dl className="flex w-full flex-col gap-4 rounded-2xl border border-line bg-surface p-4 text-left">
          <DetailRow icon={<Scissors className="size-5" />} label="Serviço" value={`${service.name} · ${formatBRL(service.priceCents)}`} />
          <DetailRow icon={<UserRound className="size-5" />} label="Profissional" value={professional.name} />
          <DetailRow icon={<CalendarDays className="size-5" />} label="Data e horário" value={slotSummary(startsAt, timeZone)} />
          {address ? <DetailRow icon={<MapPin className="size-5" />} label="Endereço" value={address} /> : null}
        </dl>
        <div className="flex w-full items-center justify-between rounded-2xl border border-dashed border-line-strong px-4 py-4">
          <span className="text-body-md text-fg-muted">Código da reserva</span>
          <span className="text-title-md text-fg-accent">{reservationCode(confirmation.appointmentId)}</span>
        </div>
      </main>
      <BottomBar>
        <Button variant="secondary" block onClick={addToCalendar}>
          Adicionar ao calendário
        </Button>
        <a href={confirmation.cancelUrl} className="py-2 text-center text-label-md text-fg-accent">
          Cancelar agendamento
        </a>
      </BottomBar>
    </StepScreen>
  );
}
