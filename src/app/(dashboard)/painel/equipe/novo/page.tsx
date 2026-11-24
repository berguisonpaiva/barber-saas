import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/painel/page-header";
import { ProfessionalForm } from "@/components/painel/professional-form";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { listServiceOptions } from "@/modules/catalog/application/use-cases/list-service-options";
import { createProfessionalAction } from "@/modules/professionals/presentation/actions/professional-actions";

export const metadata: Metadata = { title: "Novo profissional" };

export default function NovoProfissionalPage() {
  return (
    <main className="flex flex-col gap-6 px-6 pt-6">
      <PageHeader title="Novo profissional" back={{ href: "/painel/equipe", label: "Equipe" }} />
      <Suspense fallback={<div className="h-[360px] animate-pulse rounded-xl bg-surface" />}>
        <NewProfessionalForm />
      </Suspense>
    </main>
  );
}

async function NewProfessionalForm() {
  const { tenantId } = await requireOwner();
  const services = await listServiceOptions(tenantId);
  return (
    <ProfessionalForm
      action={createProfessionalAction}
      services={services}
      defaults={{ name: "", serviceIds: services.filter((s) => s.active).map((s) => s.id), active: true }}
      submitLabel="Salvar e definir expediente"
    />
  );
}
