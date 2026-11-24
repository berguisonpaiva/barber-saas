import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/painel/page-header";
import { ProfessionalTabs } from "@/components/painel/professional-tabs";
import { WeeklyScheduleEditor } from "@/components/painel/weekly-schedule-editor";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { getWeeklySchedule } from "@/modules/scheduling/application/use-cases/manage-weekly-schedule";
import { saveWeeklyScheduleAction } from "@/modules/scheduling/presentation/actions/availability-actions";
import { minutesToClock } from "@/shared/time/format";
import { loadProfessional } from "../load-professional";

export const metadata: Metadata = { title: "Expediente" };

/** Tela P6: expediente semanal com intervalos (RF-06). */
export default function ExpedientePage({ params }: PageProps<"/painel/equipe/[id]/expediente">) {
  return (
    <main className="flex flex-col gap-6 px-6 pt-6">
      <Suspense fallback={<div className="h-[640px] animate-pulse rounded-xl bg-surface" />}>
        <Schedule params={params} />
      </Suspense>
    </main>
  );
}

async function Schedule({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await requireOwner();
  const professional = await loadProfessional(tenantId, id);
  const periods = await getWeeklySchedule(tenantId, professional.id);

  return (
    <>
      <PageHeader title={professional.name} overline="Expediente" back={{ href: "/painel/equipe", label: "Equipe" }} />
      <ProfessionalTabs professionalId={professional.id} current="expediente" />
      <p className="text-body-sm text-fg-muted">
        Horários no fuso da barbearia. Para um intervalo (ex.: almoço), divida o dia em dois períodos.
      </p>
      <WeeklyScheduleEditor
        action={saveWeeklyScheduleAction.bind(null, professional.id)}
        initialPeriods={periods.map((p) => ({
          weekday: p.weekday,
          start: minutesToClock(p.startMinute),
          end: minutesToClock(Math.min(p.endMinute, 23 * 60 + 59)),
        }))}
      />
    </>
  );
}
