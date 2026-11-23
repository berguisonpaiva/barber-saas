"use client";

import { useState } from "react";
import { Clock, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/shared/utils/money";
import type { BookableProfessional, BookableService, BookingConfirmation } from "./booking-api";
import { BottomBar, ChoiceCard } from "./booking-chrome";
import { DetailsStep } from "./details-step";
import { ProfessionalStep } from "./professional-step";
import { ReceiptStep } from "./receipt-step";
import { SlotStep } from "./slot-step";

type Step = "service" | "professional" | "slot" | "details" | "done";

const SLOT_TAKEN_NOTICE = "Esse horário acabou de ser ocupado. Escolha outro.";

/** Fluxo de agendamento da página pública: C1 (serviço) → C2 → C3 → C4 → C5. */
export function BookingFlow(props: {
  slug: string;
  shopName: string;
  address: string | null;
  timeZone: string;
  maxAdvanceDays: number;
  bookingEnabled: boolean;
  services: BookableService[];
}) {
  const { slug, shopName, address, timeZone, maxAdvanceDays, bookingEnabled, services } = props;
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<BookableService | null>(null);
  const [professional, setProfessional] = useState<BookableProfessional | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  if (step === "professional" && service) {
    return (
      <ProfessionalStep
        slug={slug}
        service={service}
        timeZone={timeZone}
        selected={professional}
        onSelect={(chosen) => {
          setProfessional(chosen);
          setSlot(null);
        }}
        onBack={() => setStep("service")}
        onContinue={() => setStep("slot")}
      />
    );
  }

  if (step === "slot" && service && professional) {
    return (
      <SlotStep
        key={`${professional.id}-${notice ?? ""}`}
        slug={slug}
        service={service}
        professional={professional}
        timeZone={timeZone}
        maxAdvanceDays={maxAdvanceDays}
        selectedSlot={slot}
        notice={notice}
        onSelect={setSlot}
        onBack={() => setStep("professional")}
        onContinue={() => {
          setNotice(null);
          setStep("details");
        }}
      />
    );
  }

  if (step === "details" && service && professional && slot) {
    return (
      <DetailsStep
        slug={slug}
        service={service}
        professional={professional}
        slot={slot}
        timeZone={timeZone}
        onChangeSlot={() => setStep("slot")}
        onBack={() => setStep("slot")}
        onSlotTaken={() => {
          setSlot(null);
          setNotice(SLOT_TAKEN_NOTICE);
          setStep("slot");
        }}
        onConfirmed={(confirmed) => {
          setConfirmation(confirmed);
          setStep("done");
        }}
      />
    );
  }

  if (step === "done" && service && professional && confirmation) {
    return (
      <ReceiptStep
        shopName={shopName}
        address={address}
        service={service}
        professional={professional}
        confirmation={confirmation}
        timeZone={timeZone}
      />
    );
  }

  return (
    <ServiceStep
      services={services}
      bookingEnabled={bookingEnabled}
      selected={service}
      onSelect={(chosen) => {
        setService(chosen);
        setProfessional(null);
        setSlot(null);
      }}
      onContinue={() => setStep("professional")}
    />
  );
}

/** Tela C1 · lista de serviços (seleção só quando o agendamento público está liberado). */
function ServiceStep({
  services,
  bookingEnabled,
  selected,
  onSelect,
  onContinue,
}: {
  services: BookableService[];
  bookingEnabled: boolean;
  selected: BookableService | null;
  onSelect: (service: BookableService) => void;
  onContinue: () => void;
}) {
  return (
    <>
      <section className="flex flex-col gap-3 px-6 pb-10 pt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-title-lg">Serviços</h2>
          <p className="text-body-sm text-fg-muted">{services.length} disponíveis</p>
        </div>
        <div role={bookingEnabled ? "radiogroup" : undefined} aria-label="Serviços" className="flex flex-col gap-3">
          {services.map((service) =>
            bookingEnabled ? (
              <ChoiceCard key={service.id} selected={selected?.id === service.id} onSelect={() => onSelect(service)}>
                <ServiceSummary service={service} selected={selected?.id === service.id} />
              </ChoiceCard>
            ) : (
              <article key={service.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
                <ServiceSummary service={service} selected={false} />
              </article>
            ),
          )}
        </div>
      </section>
      {bookingEnabled && selected ? (
        <BottomBar>
          <Button block onClick={onContinue}>
            Continuar · {formatBRL(selected.priceCents)}
          </Button>
        </BottomBar>
      ) : null}
    </>
  );
}

function ServiceSummary({ service, selected }: { service: BookableService; selected: boolean }) {
  return (
    <>
      <span
        aria-hidden
        className={
          selected
            ? "grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-on-accent"
            : "grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-fg-accent"
        }
      >
        <Scissors className="size-5" />
      </span>
      <span className="flex flex-1 flex-col">
        <span className="text-title-sm">{service.name}</span>
        <span className="flex items-center gap-1 text-body-sm text-fg-muted">
          <Clock className="size-3.5" aria-hidden /> {service.durationMinutes} min
        </span>
      </span>
      <span className={selected ? "text-title-sm text-fg-accent" : "text-title-sm"}>{formatBRL(service.priceCents)}</span>
    </>
  );
}
