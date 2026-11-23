"use client";

import { useEffect, useMemo, useState } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clockTime } from "@/shared/time/format";
import { LocalDay } from "@/shared/time/local-day";
import { cn } from "@/shared/utils/cn";
import { formatBRL } from "@/shared/utils/money";
import { bookingApi, type BookableProfessional, type BookableService } from "./booking-api";
import { BottomBar, StepHeader, StepScreen } from "./booking-chrome";
import { dayPill, monthTitle, slotSummary, splitByPeriod, timeZoneLabel } from "./booking-labels";

type DaySlots = { status: "ready"; slots: Date[] } | { status: "error"; message: string };

/** Tela C3 · Data e horário. */
export function SlotStep(props: {
  slug: string;
  service: BookableService;
  professional: BookableProfessional;
  timeZone: string;
  maxAdvanceDays: number;
  selectedSlot: string | null;
  notice: string | null;
  onSelect: (slot: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { slug, service, professional, timeZone, maxAdvanceDays, selectedSlot, notice, onSelect, onBack, onContinue } = props;
  const days = useMemo(() => {
    const today = LocalDay.today({ now: () => new Date() }, timeZone);
    return Array.from({ length: maxAdvanceDays + 1 }, (_, offset) => today.addDays(offset));
  }, [timeZone, maxAdvanceDays]);
  const [day, setDay] = useState(() => {
    const start = selectedSlot ?? professional.nextSlot;
    return start ? LocalDay.of(new Date(start), timeZone).toString() : days[0].toString();
  });
  const [slotsByDay, setSlotsByDay] = useState<Record<string, DaySlots>>({});
  const current = slotsByDay[day];
  const loaded = current !== undefined;

  useEffect(() => {
    if (loaded) return;
    let active = true;
    bookingApi(slug)
      .slots({ serviceId: service.id, professionalId: professional.id, date: day })
      .then((slots) => active && setSlotsByDay((all) => ({ ...all, [day]: { status: "ready", slots: slots.map((s) => new Date(s)) } })))
      .catch((error: Error) => active && setSlotsByDay((all) => ({ ...all, [day]: { status: "error", message: error.message } })));
    return () => {
      active = false;
    };
  }, [slug, service.id, professional.id, day, loaded]);

  const selected = selectedSlot ? new Date(selectedSlot) : null;
  const selectedDay = LocalDay.parse(day, timeZone);

  return (
    <StepScreen>
      <StepHeader step={3} label="Data e horário" title="Data e horário" onBack={onBack} />
      <main className="flex flex-col gap-5 pb-6 pt-5">
        <div className="flex items-baseline justify-between px-6">
          <h2 className="text-title-lg">{monthTitle(selectedDay)}</h2>
          <p className="text-body-sm text-fg-muted">com {professional.name}</p>
        </div>
        <DayStrip days={days} selected={day} slotsByDay={slotsByDay} onSelect={setDay} />
        {notice ? <p role="alert" className="mx-6 rounded-xl bg-danger-subtle px-4 py-3 text-body-sm text-danger">{notice}</p> : null}
        <div className="flex flex-col gap-5 px-6">
          <SlotGrid daySlots={current} timeZone={timeZone} selected={selected} onSelect={onSelect} />
          <p className="flex items-center gap-2 text-body-sm text-fg-muted">
            <Globe className="size-4" aria-hidden />
            Horários no fuso de {timeZoneLabel(timeZone, selected ?? new Date())}
          </p>
        </div>
      </main>
      <BottomBar>
        {selected ? (
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-title-sm">{slotSummary(selected, timeZone)}</span>
              <span className="text-body-sm text-fg-muted">
                até {clockTime(new Date(selected.getTime() + service.durationMinutes * 60_000), timeZone)} · {professional.name}
              </span>
            </div>
            <span className="text-title-md text-fg-accent">{formatBRL(service.priceCents)}</span>
          </div>
        ) : null}
        <Button block disabled={!selected} onClick={onContinue}>
          Continuar
        </Button>
      </BottomBar>
    </StepScreen>
  );
}

function DayStrip({
  days,
  selected,
  slotsByDay,
  onSelect,
}: {
  days: LocalDay[];
  selected: string;
  slotsByDay: Record<string, DaySlots>;
  onSelect: (day: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Dia" className="flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none]">
      {days.map((day) => {
        const key = day.toString();
        const { weekday, day: date } = dayPill(day);
        const known = slotsByDay[key];
        const empty = known?.status === "ready" && known.slots.length === 0;
        const isSelected = key === selected;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(key)}
            className={cn(
              "flex h-20 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-full border",
              isSelected ? "border-accent bg-accent text-on-accent" : "border-line bg-surface",
              empty && !isSelected ? "border-dashed text-fg-disabled" : null,
            )}
          >
            <span className="text-overline">{weekday}</span>
            <span className="text-title-md">{date}</span>
          </button>
        );
      })}
    </div>
  );
}

function SlotGrid({
  daySlots,
  timeZone,
  selected,
  onSelect,
}: {
  daySlots: DaySlots | undefined;
  timeZone: string;
  selected: Date | null;
  onSelect: (slot: string) => void;
}) {
  if (!daySlots) return <div className="h-32 animate-pulse rounded-2xl border border-line bg-surface" aria-label="Carregando horários" />;
  if (daySlots.status === "error") return <p className="text-body-md text-danger">{daySlots.message}</p>;
  if (!daySlots.slots.length) return <p className="text-body-md text-fg-muted">Sem horários neste dia. Escolha outro dia acima.</p>;

  const { morning, afternoon } = splitByPeriod(daySlots.slots, timeZone);
  return (
    <>
      <SlotPeriod title="Manhã" slots={morning} timeZone={timeZone} selected={selected} onSelect={onSelect} />
      <SlotPeriod title="Tarde" slots={afternoon} timeZone={timeZone} selected={selected} onSelect={onSelect} />
    </>
  );
}

function SlotPeriod({
  title,
  slots,
  timeZone,
  selected,
  onSelect,
}: {
  title: string;
  slots: Date[];
  timeZone: string;
  selected: Date | null;
  onSelect: (slot: string) => void;
}) {
  if (!slots.length) return null;
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-overline text-fg-muted">{title}</h3>
      <div role="radiogroup" aria-label={title} className="grid grid-cols-4 gap-2">
        {slots.map((slot) => {
          const isSelected = selected?.getTime() === slot.getTime();
          return (
            <button
              key={slot.toISOString()}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(slot.toISOString())}
              className={cn(
                "h-12 rounded-xl border text-label-md",
                isSelected ? "border-accent bg-accent text-on-accent" : "border-line bg-surface",
              )}
            >
              {clockTime(slot, timeZone)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
