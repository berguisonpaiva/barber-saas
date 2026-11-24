import type { Metadata, Route } from "next";
import { Suspense } from "react";
import { Search, UserRound } from "lucide-react";
import { EmptyState } from "@/components/painel/empty-state";
import { ListRow } from "@/components/painel/list-row";
import { PageHeader } from "@/components/painel/page-header";
import { Avatar } from "@/components/ui/avatar";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { listCustomers } from "@/modules/customers/application/use-cases/list-customers";
import { dayMonth } from "@/shared/time/format";

export const metadata: Metadata = { title: "Clientes" };

/** RF-16: clientes que já marcaram pelo link, com busca. */
export default function ClientesPage({ searchParams }: PageProps<"/painel/mais/clientes">) {
  return (
    <main className="flex flex-col gap-6 px-6 pt-6">
      <PageHeader title="Clientes" overline="Histórico" back={{ href: "/painel/mais", label: "Mais" }} />
      <Suspense fallback={<ListSkeleton />}>
        <CustomerList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const visitsLabel = (count: number) => (count === 1 ? "1 agendamento" : `${count} agendamentos`);

async function CustomerList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const { tenantId } = await requireOwner();
  const { timeZone, customers } = await listCustomers(tenantId, query);

  return (
    <>
      <form role="search" className="flex h-[54px] items-center gap-2 rounded-md border border-line bg-surface px-4 focus-within:border-focus">
        <Search className="size-5 text-fg-muted" aria-hidden />
        <input
          name="q"
          type="search"
          defaultValue={query}
          aria-label="Buscar por nome ou WhatsApp"
          placeholder="Buscar por nome ou WhatsApp"
          className="h-full w-full bg-transparent text-body-lg text-fg outline-none placeholder:text-fg-disabled"
        />
      </form>
      {customers.length ? (
        <ul className="flex flex-col gap-3">
          {customers.map((customer) => (
            <li key={customer.id}>
              <ListRow
                href={`/painel/mais/clientes/${customer.id}` as Route}
                leading={<Avatar name={customer.name} size="sm" />}
                title={customer.name}
                subtitle={`${visitsLabel(customer.appointmentCount)}${
                  customer.lastVisitAt ? ` · última visita ${dayMonth(customer.lastVisitAt, timeZone)}` : ""
                }`}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<UserRound aria-hidden />}
          title={query ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
          text={query ? "Tente outro nome ou número." : "Os clientes aparecem aqui depois do primeiro agendamento pelo link."}
        />
      )}
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      <div className="h-[54px] animate-pulse rounded-md bg-surface" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[72px] animate-pulse rounded-xl bg-surface" />
      ))}
    </div>
  );
}
