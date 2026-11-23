import type { Metadata } from "next";
import { Suspense } from "react";
import { clockTime } from "@/shared/time/format";
import { Badge } from "@/components/ui/badge";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { listAgenda } from "@/modules/appointments/application/use-cases/list-agenda";

export const metadata: Metadata = { title: "Agenda" };

const statusUi = {
  CONFIRMED: { label: "Confirmado", tone: "accent", bar: "bg-accent" },
  COMPLETED: { label: "Concluído", tone: "success", bar: "bg-success" },
  CANCELED: { label: "Cancelado", tone: "danger", bar: "bg-danger" },
  NO_SHOW: { label: "Faltou", tone: "neutral", bar: "bg-fg-disabled" },
} as const;

export default function AgendaPage() {
  return (
    <main className="flex flex-col gap-4 px-6 pt-6">
      <header className="flex flex-col gap-1">
        <p className="text-overline text-fg-accent">Hoje</p>
        <h1 className="text-display-sm">Agenda</h1>
      </header>
      {/* Cache Components: leitura de sessão fica atrás de Suspense */}
      <Suspense fallback={<AgendaSkeleton />}>
        <AgendaList />
      </Suspense>
    </main>
  );
}

async function AgendaList() {
  const { tenantId } = await requireOwner();
  const { timeZone, appointments } = await listAgenda(tenantId);

  if (!appointments.length) {
    return <p className="text-body-md text-fg-muted">Nenhum agendamento hoje.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {appointments.map((a) => {
        const ui = statusUi[a.status];
        const time = clockTime(a.startsAt, timeZone);
        return (
          <li key={a.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <div className="w-[52px]">
              <p className="text-numeric-md">{time}</p>
              <p className="text-body-sm text-fg-muted">{a.durationSnapshotMinute} min</p>
            </div>
            <span className={`h-11 w-[3px] rounded-full ${ui.bar}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-title-sm">{a.customerNameSnapshot}</p>
              <p className="truncate text-body-sm text-fg-muted">
                {a.serviceNameSnapshot} · {a.professional.name}
              </p>
            </div>
            <Badge tone={ui.tone}>{ui.label}</Badge>
          </li>
        );
      })}
    </ul>
  );
}

function AgendaSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[72px] animate-pulse rounded-xl bg-surface" />
      ))}
    </div>
  );
}
