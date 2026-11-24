import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clockTime, WEEKDAY_LONG } from "@/shared/time/format";
import { APPOINTMENT_STATUS_UI } from "@/components/painel/appointment-status";
import { Badge } from "@/components/ui/badge";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { listAgenda } from "@/modules/appointments/application/use-cases/list-agenda";
import { ValidationError } from "@/shared/errors/app-error";
import { LocalDay } from "@/shared/time/local-day";
import { systemClock } from "@/shared/utils/clock";
import { cn } from "@/shared/utils/cn";

export const metadata: Metadata = { title: "Agenda" };

const statusBar = {
  CONFIRMED: "bg-accent",
  COMPLETED: "bg-success",
  CANCELED: "bg-danger",
  NO_SHOW: "bg-fg-disabled",
} as const;

export default function AgendaPage({ searchParams }: PageProps<"/painel/agenda">) {
  return (
    <main className="flex flex-col gap-4 px-6 pt-6">
      {/* Cache Components: leitura de sessão fica atrás de Suspense */}
      <Suspense fallback={<AgendaSkeleton />}>
        <AgendaList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function loadAgenda(tenantId: string, date: string | undefined) {
  try {
    return await listAgenda(tenantId, date);
  } catch (error) {
    if (error instanceof ValidationError) return listAgenda(tenantId);
    throw error;
  }
}

const agendaHref = (date: string) => `/painel/agenda?data=${date}` as Route;

function dayTitle(day: LocalDay, today: LocalDay): string {
  if (day.toString() === today.toString()) return "Hoje";
  if (day.toString() === today.addDays(-1).toString()) return "Ontem";
  if (day.toString() === today.addDays(1).toString()) return "Amanhã";
  const [, month, date] = day.toString().split("-");
  return `${WEEKDAY_LONG[day.weekday]}, ${date}/${month}`;
}

async function AgendaList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { data } = await searchParams;
  const { tenantId } = await requireOwner();
  const { date, timeZone, appointments } = await loadAgenda(tenantId, typeof data === "string" ? data : undefined);
  const day = LocalDay.parse(date, timeZone);
  const today = LocalDay.today(systemClock, timeZone);

  return (
    <>
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-overline text-fg-accent">{dayTitle(day, today)}</p>
          <h1 className="text-display-sm">Agenda</h1>
        </div>
        <nav aria-label="Trocar dia" className="flex items-center gap-1">
          <Link
            href={agendaHref(day.addDays(-1).toString())}
            aria-label="Dia anterior"
            className="grid size-11 place-items-center rounded-full border border-line bg-surface text-fg-muted"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          {day.toString() !== today.toString() ? (
            <Link
              href="/painel/agenda"
              className="flex h-11 items-center rounded-full border border-line bg-surface px-4 text-label-md"
            >
              Hoje
            </Link>
          ) : null}
          <Link
            href={agendaHref(day.addDays(1).toString())}
            aria-label="Próximo dia"
            className="grid size-11 place-items-center rounded-full border border-line bg-surface text-fg-muted"
          >
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        </nav>
      </header>

      {appointments.length ? (
        <ul className="flex flex-col gap-3">
          {appointments.map((a) => {
            const ui = APPOINTMENT_STATUS_UI[a.status];
            const closed = a.status === "CANCELED" || a.status === "NO_SHOW";
            return (
              <li key={a.id}>
                <Link
                  href={`/painel/agenda/${a.id}` as Route}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:bg-raised"
                >
                  <div className="w-[52px]">
                    <p className="text-numeric-md">{clockTime(a.startsAt, timeZone)}</p>
                    <p className="text-body-sm text-fg-muted">{a.durationSnapshotMinute} min</p>
                  </div>
                  <span className={cn("h-11 w-[3px] rounded-full", statusBar[a.status])} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-title-sm", closed && "text-fg-muted line-through")}>
                      {a.customerNameSnapshot}
                    </p>
                    <p className="truncate text-body-sm text-fg-muted">
                      {a.serviceNameSnapshot} · {a.professional.name}
                    </p>
                  </div>
                  <Badge tone={ui.tone}>{ui.label}</Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-body-md text-fg-muted">Nenhum agendamento neste dia.</p>
      )}
    </>
  );
}

function AgendaSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      <div className="h-[60px] animate-pulse rounded-xl bg-surface" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[72px] animate-pulse rounded-xl bg-surface" />
      ))}
    </div>
  );
}
