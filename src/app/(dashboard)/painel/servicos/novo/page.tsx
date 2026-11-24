import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/painel/page-header";
import { ServiceForm } from "@/components/painel/service-form";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { createServiceAction } from "@/modules/catalog/presentation/actions/service-actions";
import { listOwnerProfessionals } from "@/modules/professionals/application/use-cases/list-owner-professionals";

export const metadata: Metadata = { title: "Novo serviço" };

/** Tela P4: novo serviço (RF-04, RN-03). */
export default function NovoServicoPage() {
  return (
    <main className="flex flex-col gap-6 px-6 pt-6">
      <PageHeader title="Novo serviço" back={{ href: "/painel/servicos", label: "Serviços" }} />
      <Suspense fallback={<div className="h-[520px] animate-pulse rounded-xl bg-surface" />}>
        <NewServiceForm />
      </Suspense>
    </main>
  );
}

async function NewServiceForm() {
  const { tenantId } = await requireOwner();
  const professionals = await listOwnerProfessionals(tenantId);
  const activeIds = professionals.filter((p) => p.active).map((p) => p.id);
  return (
    <ServiceForm
      action={createServiceAction}
      professionals={professionals}
      defaults={{ name: "", description: "", price: "", durationMinutes: 30, professionalIds: activeIds, active: true }}
      submitLabel="Salvar serviço"
    />
  );
}
