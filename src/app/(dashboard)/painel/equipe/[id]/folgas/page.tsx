import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarOff } from "lucide-react";
import { ExceptionForm } from "@/components/painel/exception-form";
import { PageHeader } from "@/components/painel/page-header";
import { ProfessionalTabs } from "@/components/painel/professional-tabs";
import { RemoveButton } from "@/components/painel/remove-button";
import { Badge } from "@/components/ui/badge";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { listUpcomingExceptions } from "@/modules/scheduling/application/use-cases/manage-availability-exceptions";
import {
  createExceptionAction,
  deleteExceptionAction,
} from "@/modules/scheduling/presentation/actions/availability-actions";
import { minutesToClock, WEEKDAY_SHORT } from "@/shared/time/format";
import { loadProfessional } from "../load-professional";

export const metadata: Metadata = { title: "Folgas e bloqueios" };

/** Tela P7: folgas e bloqueios por data (RF-07). */
export default function FolgasPage({ params }: PageProps<"/painel/equipe/[id]/folgas">) {
  return (
    <main className="flex flex-col gap-6 px-6 pt-6">
      <Suspense fallback={<div className="h-[560px] animate-pulse rounded-xl bg-surface" />}>
        <Exceptions params={params} />
      </Suspense>
    </main>
  );
}

function dateLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${WEEKDAY_SHORT[weekday]}, ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

type ExceptionRow = { type: "DAY_OFF" | "BLOCK"; startMinute: number | null; endMinute: number | null };

function rangeLabel(exception: ExceptionRow): string {
  if (exception.startMinute === null || exception.endMinute === null) return "Dia inteiro";
  return `${minutesToClock(exception.startMinute)} – ${minutesToClock(exception.endMinute)}`;
}

async function Exceptions({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await requireOwner();
  const professional = await loadProfessional(tenantId, id);
  const { today, exceptions } = await listUpcomingExceptions(tenantId, professional.id);

  return (
    <>
      <PageHeader title={professional.name} overline="Folgas e bloqueios" back={{ href: "/painel/equipe", label: "Equipe" }} />
      <ProfessionalTabs professionalId={professional.id} current="folgas" />
      <ExceptionForm action={createExceptionAction.bind(null, professional.id)} today={today} />
      <section className="flex flex-col gap-3">
        <h2 className="text-title-sm">Próximas</h2>
        {exceptions.length ? (
          <ul className="flex flex-col gap-2">
            {exceptions.map((exception) => (
              <li key={exception.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface py-2 pl-4 pr-2">
                <span className="flex min-w-0 flex-1 flex-col gap-1 py-1">
                  <span className="text-title-sm">{dateLabel(exception.date)}</span>
                  <span className="truncate text-body-sm text-fg-muted">
                    {rangeLabel(exception)}
                    {exception.reason ? ` · ${exception.reason}` : ""}
                  </span>
                </span>
                <Badge tone={exception.type === "DAY_OFF" ? "accent" : "neutral"}>
                  {exception.type === "DAY_OFF" ? "Folga" : "Bloqueio"}
                </Badge>
                <RemoveButton
                  label={`Remover ${exception.type === "DAY_OFF" ? "folga" : "bloqueio"} de ${dateLabel(exception.date)}`}
                  action={deleteExceptionAction.bind(null, professional.id, exception.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-body-sm text-fg-muted">
            <CalendarOff className="size-4" aria-hidden />
            Nenhuma folga ou bloqueio marcado.
          </p>
        )}
      </section>
    </>
  );
}
