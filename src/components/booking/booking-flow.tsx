"use client";

import { useMemo, useState } from "react";
import { Clock, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/shared/utils/money";
import {
  combineServices,
  MAX_SERVICES_PER_APPOINTMENT,
  type ServiceCombination,
} from "@/modules/scheduling/domain/service-selection";
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
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const selection = useMemo(() => {
    const chosen = serviceIds.flatMap((id) => services.find((service) => service.id === id) ?? []);
    return chosen.length ? combineServices(chosen) : null;
  }, [serviceIds, services]);
  const [professional, setProfessional] = useState<BookableProfessional | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  if (step === "professional" && selection) {
    return (
      <ProfessionalStep
        slug={slug}
        selection={selection}
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

  if (step === "slot" && selection && professional) {
    return (
      <SlotStep
        key={`${professional.id}-${notice ?? ""}`}
        slug={slug}
        selection={selection}
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

  if (step === "details" && selection && professional && slot) {
    return (
      <DetailsStep
        slug={slug}
        selection={selection}
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

  if (step === "done" && selection && professional && confirmation) {
    return (
      <ReceiptStep
        shopName={shopName}
        address={address}
        selection={selection}
        professional={professional}
        confirmation={confirmation}
        timeZone={timeZone}
        onRestart={() => {
          setServiceIds([]);
          setProfessional(null);
          setSlot(null);
          setNotice(null);
          setConfirmation(null);
          setStep("service");
        }}
      />
    );
  }

  return (
    <ServiceStep
      services={services}
      bookingEnabled={bookingEnabled}
      selectedIds={serviceIds}
      selection={selection}
      onToggle={(id) => {
        setServiceIds((ids) => (ids.includes(id) ? ids.filter((chosen) => chosen !== id) : [...ids, id]));
        setProfessional(null);
        setSlot(null);
      }}
      onContinue={() => setStep("professional")}
    />
  );
}

/** Tela C1 · lista de serviços; com o agendamento público liberado, o cliente escolhe um ou mais. */
function ServiceStep({
  services,
  bookingEnabled,
  selectedIds,
  selection,
  onToggle,
  onContinue,
}: {
  services: BookableService[];
  bookingEnabled: boolean;
  selectedIds: readonly string[];
  selection: ServiceCombination | null;
  onToggle: (serviceId: string) => void;
  onContinue: () => void;
}) {
  const limitReached = selectedIds.length >= MAX_SERVICES_PER_APPOINTMENT;
  return (
    <>
      <section className="flex flex-col gap-3 px-6 pb-10 pt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-title-lg">Serviços</h2>
          <p className="text-body-sm text-fg-muted">{services.length} disponíveis</p>
        </div>
        {bookingEnabled ? (
          <p className="text-body-sm text-fg-muted">
            {limitReached
              ? `Até ${MAX_SERVICES_PER_APPOINTMENT} serviços por agendamento.`
              : "Escolha um ou mais serviços para o mesmo horário."}
          </p>
        ) : null}
        <div role={bookingEnabled ? "group" : undefined} aria-label="Serviços" className="flex flex-col gap-3">
          {services.map((service) =>
            bookingEnabled ? (
              <ChoiceCard
                key={service.id}
                kind="checkbox"
                selected={selectedIds.includes(service.id)}
                disabled={limitReached && !selectedIds.includes(service.id)}
                onSelect={() => onToggle(service.id)}
              >
                <ServiceSummary service={service} selected={selectedIds.includes(service.id)} />
              </ChoiceCard>
            ) : (
              <article key={service.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
                <ServiceSummary service={service} selected={false} />
              </article>
            ),
          )}
        </div>
      </section>
      {bookingEnabled && selection ? (
        <BottomBar>
          <div className="flex flex-col">
            <span className="text-title-sm">{selection.name}</span>
            <span className="text-body-sm text-fg-muted">
              {servicesCount(selection.services.length)} · {selection.durationMinutes} min
            </span>
          </div>
          <Button block onClick={onContinue}>
            Continuar · {formatBRL(selection.priceCents)}
          </Button>
        </BottomBar>
      ) : null}
    </>
  );
}

const servicesCount = (count: number) => (count === 1 ? "1 serviço" : `${count} serviços`);

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
