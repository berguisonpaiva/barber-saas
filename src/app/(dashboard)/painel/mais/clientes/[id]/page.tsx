import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { APPOINTMENT_STATUS_UI } from "@/components/painel/appointment-status";
import { CustomerForm } from "@/components/painel/customer-form";
import { PageHeader } from "@/components/painel/page-header";
import { StatCard } from "@/components/painel/stat-card";
import { Badge } from "@/components/ui/badge";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { getCustomerHistory } from "@/modules/customers/application/use-cases/get-customer-history";
import { updateCustomerAction } from "@/modules/customers/presentation/actions/customer-actions";
import { NotFoundError } from "@/shared/errors/app-error";
import { parseEntityId } from "@/shared/forms/entity-id";
import { clockTime, dayMonth } from "@/shared/time/format";
import { formatBRL } from "@/shared/utils/money";
import { formatBrazilPhone } from "@/shared/utils/phone";

export const metadata: Metadata = { title: "Cliente" };

export default function ClientePage({ params }: PageProps<"/painel/mais/clientes/[id]">) {
  return (
    <main className="flex flex-col gap-6 px-6 pt-6">
      <Suspense fallback={<div className="h-[640px] animate-pulse rounded-xl bg-surface" />}>
        <Customer params={params} />
      </Suspense>
    </main>
  );
}

async function loadCustomer(tenantId: string, id: string) {
  try {
    return await getCustomerHistory(tenantId, parseEntityId(id, "Cliente não encontrado."));
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

async function Customer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await requireOwner();
  const customer = await loadCustomer(tenantId, id);
  const { stats, timeZone } = customer;

  return (
    <>
      <PageHeader title={customer.name} overline="Cliente" back={{ href: "/painel/mais/clientes", label: "Clientes" }} />
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={String(stats.total)} />
        <StatCard label="Atendidos" value={String(stats.completed)} />
        <StatCard label="Faltas" value={String(stats.noShow)} />
      </div>
      <CustomerForm
        action={updateCustomerAction.bind(null, customer.id)}
        defaults={{ name: customer.name, phone: formatBrazilPhone(customer.phone) }}
      />
      <section className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 className="text-title-sm">Histórico</h2>
        {stats.completedCents > 0 ? (
          <p className="text-body-sm text-fg-muted">Total em atendimentos: {formatBRL(stats.completedCents)}</p>
        ) : null}
        <ul className="flex flex-col gap-2">
          {customer.appointments.map((appointment) => {
            const status = APPOINTMENT_STATUS_UI[appointment.status];
            return (
              <li key={appointment.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                <span className="w-14 shrink-0">
                  <span className="block text-numeric-md">{dayMonth(appointment.startsAt, timeZone)}</span>
                  <span className="block text-body-sm text-fg-muted">{clockTime(appointment.startsAt, timeZone)}</span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-title-sm">{appointment.serviceNameSnapshot}</span>
                  <span className="truncate text-body-sm text-fg-muted">
                    {appointment.professional.name} · {formatBRL(appointment.priceSnapshotCents)}
                  </span>
                </span>
                <Badge tone={status.tone}>{status.label}</Badge>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
