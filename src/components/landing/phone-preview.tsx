import { BellRing } from "lucide-react";

const AGENDA = [
  { time: "09:00", customer: "Carlos Mendes", service: "Corte + Barba", professional: "Rafael", done: true },
  { time: "10:00", customer: "Bruno Lima", service: "Corte masculino", professional: "Diego", done: true },
  { time: "11:30", customer: "Pedro Alves", service: "Barba", professional: "Rafael", done: false },
  { time: "14:00", customer: "Lucas Rocha", service: "Pezinho", professional: "Marcos", done: false },
];

/** Ilustração do painel num celular: a agenda do dia e o aviso de um novo agendamento. */
export function PhonePreview() {
  return (
    <div role="img" aria-label="Prévia do painel no celular: agenda do dia e aviso de novo agendamento" className="relative mx-auto w-full max-w-[300px]">
      <div aria-hidden className="rounded-[44px] border-[10px] border-raised bg-canvas p-4 pt-8 shadow-floating">
        <p className="text-overline text-fg-accent">Hoje</p>
        <p className="text-display-sm">Agenda</p>
        <ul className="mt-4 flex flex-col gap-2">
          {AGENDA.map((item) => (
            <li key={item.time} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
              <span className="text-title-sm tabular-nums">{item.time}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-label-md">{item.customer}</span>
                <span className="truncate text-body-sm text-fg-muted">
                  {item.service} · {item.professional}
                </span>
              </span>
              <span className={item.done ? "size-2.5 shrink-0 rounded-full bg-success" : "size-2.5 shrink-0 rounded-full bg-accent"} />
            </li>
          ))}
        </ul>
        <div className="mt-4 h-11 rounded-full border border-line bg-raised" />
        <div className="h-16" />
      </div>
      <div
        aria-hidden
        className="absolute -left-4 bottom-8 flex w-64 items-start gap-3 rounded-2xl border border-line bg-raised p-3 shadow-floating sm:-left-12"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-on-accent">
          <BellRing className="size-4" />
        </span>
        <span className="flex flex-col">
          <span className="text-label-md">Novo agendamento</span>
          <span className="text-body-sm text-fg-muted">Lucas agendou Pezinho para 25/11 às 14h com Marcos.</span>
        </span>
      </div>
    </div>
  );
}
