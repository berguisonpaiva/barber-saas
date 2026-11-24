"use client";

import { useEffect, useState } from "react";
import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/shared/utils/money";
import type { ServiceCombination } from "@/modules/scheduling/domain/service-selection";
import { bookingApi, type BookableProfessional } from "./booking-api";
import { BottomBar, ChoiceCard, Initials, StepHeader, StepScreen } from "./booking-chrome";
import { nextSlotLabel } from "./booking-labels";

type Load = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; professionals: BookableProfessional[] };

/** Tela C2 · Escolher profissional. */
export function ProfessionalStep(props: {
  slug: string;
  selection: ServiceCombination;
  timeZone: string;
  selected: BookableProfessional | null;
  onSelect: (professional: BookableProfessional) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { slug, selection, timeZone, selected, onSelect, onBack, onContinue } = props;
  const [load, setLoad] = useState<Load>({ status: "loading" });

  useEffect(() => {
    let active = true;
    bookingApi(slug)
      .professionals(selection)
      .then((professionals) => active && setLoad({ status: "ready", professionals }))
      .catch((error: Error) => active && setLoad({ status: "error", message: error.message }));
    return () => {
      active = false;
    };
  }, [slug, selection]);

  return (
    <StepScreen>
      <StepHeader step={2} label="Profissional" title="Profissional" onBack={onBack} />
      <main className="flex flex-col gap-5 px-6 pb-6 pt-5">
        <p className="flex items-center gap-2 rounded-xl bg-accent-subtle px-4 py-3 text-body-md text-fg-accent">
          <Scissors className="size-4" aria-hidden />
          {selection.name} · {selection.durationMinutes} min · {formatBRL(selection.priceCents)}
        </p>
        <h2 className="text-display-sm">Quem vai te atender?</h2>
        <ProfessionalList load={load} timeZone={timeZone} selected={selected} onSelect={onSelect} />
      </main>
      <BottomBar>
        <Button block disabled={!selected} onClick={onContinue}>
          Continuar
        </Button>
      </BottomBar>
    </StepScreen>
  );
}

function ProfessionalList({
  load,
  timeZone,
  selected,
  onSelect,
}: {
  load: Load;
  timeZone: string;
  selected: BookableProfessional | null;
  onSelect: (professional: BookableProfessional) => void;
}) {
  if (load.status === "loading") {
    return <div className="h-48 animate-pulse rounded-2xl border border-line bg-surface" aria-label="Carregando profissionais" />;
  }
  if (load.status === "error") return <p className="text-body-md text-danger">{load.message}</p>;
  if (!load.professionals.length) return <p className="text-body-md text-fg-muted">Nenhum profissional faz esse serviço agora.</p>;

  const now = new Date();
  return (
    <div role="radiogroup" aria-label="Profissionais" className="flex flex-col gap-3">
      {load.professionals.map((professional) => (
        <ChoiceCard
          key={professional.id}
          selected={selected?.id === professional.id}
          disabled={!professional.nextSlot}
          onSelect={() => onSelect(professional)}
        >
          <Initials name={professional.name} />
          <span className="flex flex-1 flex-col">
            <span className="text-title-sm">{professional.name}</span>
            <span className="text-body-sm text-fg-muted">
              {professional.nextSlot
                ? `Próximo horário: ${nextSlotLabel(new Date(professional.nextSlot), now, timeZone)}`
                : "Sem horários nos próximos dias"}
            </span>
          </span>
        </ChoiceCard>
      ))}
    </div>
  );
}
