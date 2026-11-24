"use client";

import { useState } from "react";
import { useFormAction } from "@/components/painel/use-form-action";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/painel/form-message";
import type { FormState } from "@/shared/forms/form-state";
import { WEEKDAY_LONG, WEEKDAY_ORDER } from "@/shared/time/format";

export type EditablePeriod = { weekday: number; start: string; end: string };

type Day = { start: string; end: string }[];
type Week = Record<number, Day>;

const MAX_PERIODS_PER_DAY = 4;
const DEFAULT_DAY: Day = [{ start: "09:00", end: "18:00" }];

function toWeek(periods: EditablePeriod[]): Week {
  const week: Week = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  periods.forEach(({ weekday, start, end }) => week[weekday].push({ start, end }));
  return week;
}

function toPeriods(week: Week): EditablePeriod[] {
  return WEEKDAY_ORDER.flatMap((weekday) => week[weekday].map((period) => ({ weekday, ...period })));
}

type EditorProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initialPeriods: EditablePeriod[];
};

/** Tela P6: expediente semanal; intervalos são o espaço entre dois períodos do mesmo dia (RF-06). */
export function WeeklyScheduleEditor({ action, initialPeriods }: EditorProps) {
  const [week, setWeek] = useState<Week>(() => toWeek(initialPeriods));
  const { state, onSubmit, pending } = useFormAction(action);

  const updateDay = (weekday: number, day: Day) => setWeek((current) => ({ ...current, [weekday]: day }));

  function copyToWeekdays(weekday: number) {
    setWeek((current) => {
      const next = { ...current };
      [1, 2, 3, 4, 5].forEach((target) => (next[target] = current[weekday].map((period) => ({ ...period }))));
      return next;
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="periods" value={JSON.stringify(toPeriods(week))} />
      <ul className="flex flex-col gap-3">
        {WEEKDAY_ORDER.map((weekday) => (
          <DayRow
            key={weekday}
            weekday={weekday}
            day={week[weekday]}
            onChange={(day) => updateDay(weekday, day)}
            onCopyToWeekdays={weekday >= 1 && weekday <= 5 ? () => copyToWeekdays(weekday) : undefined}
          />
        ))}
      </ul>
      <FormMessage state={state} />
      <Button type="submit" block disabled={pending}>
        {pending ? "Salvando…" : "Salvar expediente"}
      </Button>
    </form>
  );
}

type DayRowProps = { weekday: number; day: Day; onChange: (day: Day) => void; onCopyToWeekdays?: () => void };

function DayRow({ weekday, day, onChange, onCopyToWeekdays }: DayRowProps) {
  const label = WEEKDAY_LONG[weekday];
  const working = day.length > 0;
  const lastEnd = day.at(-1)?.end ?? "13:00";

  const setPeriod = (index: number, field: "start" | "end", value: string) =>
    onChange(day.map((period, i) => (i === index ? { ...period, [field]: value } : period)));

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
        <span className="text-title-sm">{label}</span>
        <span className="flex items-center gap-3">
          <span className="text-body-sm text-fg-muted">{working ? "Atende" : "Fechado"}</span>
          <input
            type="checkbox"
            role="switch"
            className="peer sr-only"
            checked={working}
            onChange={(event) => onChange(event.target.checked ? DEFAULT_DAY : [])}
          />
          <span
            aria-hidden
            className="relative h-7 w-12 rounded-full bg-muted transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-focus after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-fg after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-on-accent"
          />
        </span>
      </label>

      {day.map((period, index) => (
        <div key={index} className="flex items-center gap-2">
          <TimeField label={`${label}, início do período ${index + 1}`} value={period.start} onChange={(v) => setPeriod(index, "start", v)} />
          <span className="text-body-sm text-fg-muted">até</span>
          <TimeField label={`${label}, fim do período ${index + 1}`} value={period.end} onChange={(v) => setPeriod(index, "end", v)} />
          <button
            type="button"
            aria-label={`Remover período ${index + 1} de ${label}`}
            onClick={() => onChange(day.filter((_, i) => i !== index))}
            className="grid size-11 shrink-0 place-items-center rounded-full text-fg-muted hover:bg-muted"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      ))}

      {working ? (
        <div className="flex flex-wrap gap-2">
          {day.length < MAX_PERIODS_PER_DAY ? (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => onChange([...day, { start: lastEnd, end: lastEnd < "19:00" ? "19:00" : "23:59" }])}
            >
              <Plus aria-hidden />
              Período (após intervalo)
            </Button>
          ) : null}
          {onCopyToWeekdays ? (
            <Button type="button" variant="ghost" size="md" onClick={onCopyToWeekdays}>
              Copiar para seg–sex
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <input
      type="time"
      aria-label={label}
      value={value}
      step={300}
      required
      onChange={(event) => onChange(event.target.value)}
      className="h-11 min-w-0 flex-1 rounded-md border border-line bg-canvas px-3 text-body-md text-fg outline-none focus:border-focus"
    />
  );
}
