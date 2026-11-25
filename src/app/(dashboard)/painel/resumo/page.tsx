import type { Metadata } from "next";
import { Suspense } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { BarList } from "@/components/charts/bar-list";
import { ColumnChart, type Column } from "@/components/charts/column-chart";
import { SegmentedBar } from "@/components/charts/segmented-bar";
import { PageHeader } from "@/components/painel/page-header";
import { SegmentedNav } from "@/components/painel/segmented-nav";
import { StatCard } from "@/components/painel/stat-card";
import { requireOwner } from "@/modules/identity/application/require-owner";
import {
  DASHBOARD_PERIODS,
  getDashboard,
  parseDashboardPeriod,
  type Dashboard,
  type DashboardPeriod,
} from "@/modules/appointments/application/use-cases/get-dashboard";
import { WEEKDAY_SHORT } from "@/shared/time/format";
import { formatBRL } from "@/shared/utils/money";
import { cn } from "@/shared/utils/cn";

export const metadata: Metadata = { title: "Resumo" };

/** RF-15: indicadores básicos da barbearia com gráficos (faturamento, movimento, serviços, equipe). */
export default function ResumoPage({ searchParams }: PageProps<"/painel/resumo">) {
  return (
    <main className="flex flex-col gap-6 px-6 pt-6">
      <PageHeader title="Resumo" overline="Indicadores" />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });
const signedPercent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 0,
  signDisplay: "exceptZero",
});

function dayLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { short: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`, weekday: WEEKDAY_SHORT[weekday] };
}

/** Variação contra o período anterior; para cima é bom em todos os indicadores mostrados. */
function Change({ value, previousLabel }: { value: number | null; previousLabel: string }) {
  if (value === null) return <span className="text-fg-muted">sem base para comparar</span>;
  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-1", value === 0 ? "text-fg-muted" : up ? "text-success" : "text-danger")}>
      {value !== 0 ? <Icon className="size-4" aria-hidden /> : null}
      <span>
        {signedPercent.format(value)} <span className="text-fg-muted">vs {previousLabel}</span>
      </span>
    </span>
  );
}

function seriesColumns(dashboard: Dashboard): Column[] {
  return dashboard.series.map((bucket) => {
    const first = dayLabel(bucket.start);
    const label =
      bucket.days === 1 ? `${first.weekday}, ${first.short}` : `Semana de ${first.short} (${bucket.days} dias)`;
    return {
      key: bucket.start,
      axisLabel: bucket.days === 1 && dashboard.days === 7 ? first.weekday : first.short,
      label,
      value: bucket.booked,
      details: [{ label: "Faturamento", value: formatBRL(bucket.revenueCents) }],
    };
  });
}

function hourColumns(dashboard: Dashboard): Column[] {
  return dashboard.byHour.map(({ hour, booked }) => ({
    key: String(hour),
    axisLabel: `${hour}h`,
    label: `${String(hour).padStart(2, "0")}:00 – ${String(hour).padStart(2, "0")}:59`,
    value: booked,
  }));
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-title-sm">{title}</h2>
        {subtitle ? <p className="text-body-sm text-fg-muted">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

async function DashboardContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { dias } = await searchParams;
  const days = parseDashboardPeriod(dias);
  const { tenantId } = await requireOwner();
  const dashboard = await getDashboard(tenantId, days);
  const { totals, changes } = dashboard;
  const previousLabel = `${days} dias antes`;
  const from = dayLabel(dashboard.from).short;
  const to = dayLabel(dashboard.to).short;

  return (
    <>
      <PeriodFilter current={days} />
      <section aria-label="Faturamento do período" className="flex flex-col gap-1">
        <p className="text-body-sm text-fg-muted">
          Faturamento · {from} a {to}
        </p>
        <p className="text-[48px] font-semibold leading-none tracking-tight">{formatBRL(totals.revenueCents)}</p>
        <p className="text-body-sm">
          <Change value={changes.revenue} previousLabel={previousLabel} />
        </p>
        <p className="text-body-sm text-fg-muted">Confirmados e atendidos, pelo preço de cada agendamento.</p>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Agendamentos"
          value={String(totals.booked)}
          detail={<Change value={changes.booked} previousLabel={previousLabel} />}
        />
        <StatCard
          label="Ticket médio"
          value={formatBRL(totals.averageTicketCents)}
          detail={<Change value={changes.averageTicket} previousLabel={previousLabel} />}
        />
        <StatCard
          label="Cancelamentos"
          value={percent.format(totals.cancellationRate)}
          detail={<span className="text-fg-muted">{totals.canceled} no período</span>}
        />
        <StatCard
          label="Faltas"
          value={percent.format(totals.noShowRate)}
          detail={<span className="text-fg-muted">{totals.noShow} no período</span>}
        />
      </div>

      <Card
        title={days > 30 ? "Agendamentos por semana" : "Agendamentos por dia"}
        subtitle="Sem os cancelados. Toque numa coluna para ver o faturamento."
      >
        <ColumnChart
          title={days > 30 ? "Agendamentos por semana" : "Agendamentos por dia"}
          columns={seriesColumns(dashboard)}
          unit="agendamentos"
          axisEvery={days === 30 ? 5 : days > 30 ? 3 : 1}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Situação dos agendamentos" subtitle={`${totals.booked + totals.canceled} no período`}>
          <SegmentedBar
            title="Situação dos agendamentos"
            segments={[
              { key: "COMPLETED", label: "Atendidos", value: dashboard.statuses.COMPLETED, colorClass: "bg-success" },
              { key: "CONFIRMED", label: "Confirmados", value: dashboard.statuses.CONFIRMED, colorClass: "bg-chart" },
              { key: "NO_SHOW", label: "Faltou", value: dashboard.statuses.NO_SHOW, colorClass: "bg-chart-neutral" },
              { key: "CANCELED", label: "Cancelados", value: dashboard.statuses.CANCELED, colorClass: "bg-danger" },
            ]}
          />
        </Card>

        <Card title="Faturamento por serviço">
          <BarList
            title="Faturamento por serviço"
            empty="Nenhum faturamento no período."
            items={dashboard.byService.map((item) => ({ ...item, display: formatBRL(item.value) }))}
          />
        </Card>

        <Card title="Agendamentos por profissional">
          <BarList
            title="Agendamentos por profissional"
            empty="Nenhum agendamento no período."
            items={dashboard.byProfessional.map((item) => ({ ...item, display: String(item.value) }))}
          />
        </Card>

        <Card title="Horários de pico" subtitle="Hora de início dos agendamentos, no fuso da barbearia.">
          {dashboard.byHour.length ? (
            <ColumnChart
              title="Agendamentos por hora de início"
              columns={hourColumns(dashboard)}
              unit="agendamentos"
              axisEvery={dashboard.byHour.length > 8 ? 2 : 1}
            />
          ) : (
            <p className="text-body-sm text-fg-muted">Nenhum agendamento no período.</p>
          )}
        </Card>
      </div>
      <p className="text-body-sm text-fg-muted">Clientes atendidos ou marcados no período: {totals.customers}</p>
    </>
  );
}

function PeriodFilter({ current }: { current: DashboardPeriod }) {
  return (
    <SegmentedNav
      label="Período"
      segments={DASHBOARD_PERIODS.map((period) => ({
        href: period === 30 ? "/painel/resumo" : `/painel/resumo?dias=${period}`,
        label: `${period} dias`,
        active: period === current,
      }))}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="h-[52px] animate-pulse rounded-full bg-surface" />
      <div className="h-[110px] animate-pulse rounded-xl bg-surface" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
      <div className="h-[280px] animate-pulse rounded-xl bg-surface" />
    </div>
  );
}
