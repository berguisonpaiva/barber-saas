"use client";

import { useState, type FormEvent } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/shared/utils/money";
import type { ServiceCombination } from "@/modules/scheduling/domain/service-selection";
import { BookingApiError, bookingApi, type BookableProfessional, type BookingConfirmation } from "./booking-api";
import { BottomBar, StepHeader, StepScreen } from "./booking-chrome";
import { slotSummary } from "./booking-labels";
import { forgetCustomer, recallCustomer, rememberCustomer } from "./customer-memory";

/** Tela C4 · Seus dados. */
export function DetailsStep(props: {
  slug: string;
  selection: ServiceCombination;
  professional: BookableProfessional;
  slot: string;
  timeZone: string;
  onChangeSlot: () => void;
  onBack: () => void;
  onSlotTaken: () => void;
  onConfirmed: (confirmation: BookingConfirmation, customerName: string) => void;
}) {
  const { slug, selection, professional, slot, timeZone, onChangeSlot, onBack, onSlotTaken, onConfirmed } = props;
  const [remembered] = useState(recallCustomer);
  const [name, setName] = useState(remembered?.name ?? "");
  const [phone, setPhone] = useState(remembered?.phone ?? "");
  const [remember, setRemember] = useState(true);
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const honeypot = String(new FormData(event.currentTarget).get("website") ?? "");
      const confirmation = await bookingApi(slug).book({
        selection,
        professionalId: professional.id,
        startsAt: slot,
        customer: { name: name.trim(), phone: `+55 ${phone}` },
        consent,
        website: honeypot,
      });
      if (remember) rememberCustomer({ name: name.trim(), phone });
      else forgetCustomer();
      onConfirmed(confirmation, name.trim());
    } catch (failure) {
      if (failure instanceof BookingApiError && failure.code === "SLOT_UNAVAILABLE") return onSlotTaken();
      setError(failure instanceof Error ? failure.message : "Não foi possível agendar. Tente de novo.");
      setSending(false);
    }
  }

  const ready = name.trim().length >= 2 && phone.replace(/\D/g, "").length >= 10 && consent;

  return (
    <StepScreen>
      <StepHeader step={4} label="Seus dados" title="Seus dados" onBack={onBack} />
      <form onSubmit={confirm} className="flex flex-1 flex-col">
        <main className="flex flex-col gap-5 px-6 pb-6 pt-5">
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
            <span className="grid size-11 place-items-center rounded-xl bg-accent-subtle text-fg-accent">
              <CalendarDays className="size-5" aria-hidden />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-title-sm">{slotSummary(new Date(slot), timeZone)}</span>
              <span className="text-body-sm text-fg-muted">
                {selection.name} · {professional.name}
              </span>
            </span>
            <button type="button" onClick={onChangeSlot} className="text-label-md text-fg-accent">
              Alterar
            </button>
          </div>

          <Input label="Seu nome" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="WhatsApp"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            prefix="+55"
            placeholder="(85) 99876-5432"
            helper="Usado só para contato sobre este agendamento. Não precisa criar conta."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="sr-only" />

          <label className="flex items-start gap-3 text-body-sm text-fg-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-accent"
            />
            Lembrar meu nome e WhatsApp neste aparelho para o próximo agendamento.
          </label>

          <label className="flex items-start gap-3 text-body-sm text-fg-muted">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-accent"
            />
            Concordo com o uso dos meus dados para este agendamento, conforme a Política de Privacidade (LGPD).
          </label>

          {error ? (
            <p role="alert" className="text-body-sm text-danger">
              {error}
            </p>
          ) : null}
        </main>

        <BottomBar>
          <div className="flex items-center justify-between">
            <span className="text-body-md text-fg-muted">Total · pago na barbearia</span>
            <span className="text-title-lg">{formatBRL(selection.priceCents)}</span>
          </div>
          <Button type="submit" block disabled={!ready || sending}>
            {sending ? "Confirmando…" : "Confirmar agendamento"}
          </Button>
        </BottomBar>
      </form>
    </StepScreen>
  );
}
