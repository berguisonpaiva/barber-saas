import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, Scissors } from "lucide-react";
import { ActiveSwitch } from "@/components/painel/active-switch";
import { EmptyState } from "@/components/painel/empty-state";
import { PageHeader } from "@/components/painel/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { listOwnerServices } from "@/modules/catalog/application/use-cases/list-owner-services";
import { setServiceActiveAction } from "@/modules/catalog/presentation/actions/service-actions";
import { formatBRL } from "@/shared/utils/money";

export const metadata: Metadata = { title: "Serviços" };

/** Tela P3: lista de serviços com ativar/desativar (RF-04, RN-09). */
export default function ServicosPage() {
  return (
    <main className="flex flex-col gap-6 px-6 pt-6">
      <PageHeader
        title="Serviços"
        overline="Catálogo"
        action={
          <Link href="/painel/servicos/novo" className={buttonVariants({ size: "md" })}>
            <Plus aria-hidden />
            Novo
          </Link>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <ServiceList />
      </Suspense>
    </main>
  );
}

const professionalsLabel = (count: number) => (count === 1 ? "1 profissional" : `${count} profissionais`);

async function ServiceList() {
  const { tenantId } = await requireOwner();
  const services = await listOwnerServices(tenantId);

  if (!services.length) {
    return (
      <EmptyState
        icon={<Scissors aria-hidden />}
        title="Nenhum serviço ainda"
        text="Cadastre o primeiro para ele aparecer no seu link de agendamento."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {services.map((service) => (
        <li key={service.id} className="flex items-center gap-2 rounded-xl border border-line bg-surface py-2 pl-4 pr-2">
          <Link href={`/painel/servicos/${service.id}`} className="flex min-w-0 flex-1 flex-col py-2">
            <span className={service.active ? "truncate text-title-sm" : "truncate text-title-sm text-fg-muted"}>
              {service.name}
            </span>
            <span className="truncate text-body-sm text-fg-muted">
              {service.durationMinutes} min · {formatBRL(service.priceCents)} · {professionalsLabel(service.professionalCount)}
            </span>
            {service.active && service.professionalCount === 0 ? (
              <Badge tone="danger" className="mt-2 self-start">
                Sem profissional: fora do link
              </Badge>
            ) : null}
          </Link>
          <ActiveSwitch
            active={service.active}
            label={`${service.active ? "Desativar" : "Ativar"} ${service.name}`}
            action={setServiceActiveAction.bind(null, service.id)}
          />
        </li>
      ))}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[76px] animate-pulse rounded-xl bg-surface" />
      ))}
    </div>
  );
}
