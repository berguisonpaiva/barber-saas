import type { Metadata } from "next";
import { Suspense } from "react";
import { DeleteForm } from "@/components/painel/delete-form";
import { PageHeader } from "@/components/painel/page-header";
import { ProfessionalForm } from "@/components/painel/professional-form";
import { ProfessionalTabs } from "@/components/painel/professional-tabs";
import { Note } from "@/components/ui/note";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { listServiceOptions } from "@/modules/catalog/application/use-cases/list-service-options";
import {
  deleteProfessionalAction,
  updateProfessionalAction,
} from "@/modules/professionals/presentation/actions/professional-actions";
import { loadProfessional } from "./load-professional";

export const metadata: Metadata = { title: "Profissional" };

export default function ProfissionalPage({ params }: PageProps<"/painel/equipe/[id]">) {
  return (
    <main className="flex flex-col gap-6 px-6 pt-6">
      <Suspense fallback={<div className="h-[480px] animate-pulse rounded-xl bg-surface" />}>
        <ProfessionalData params={params} />
      </Suspense>
    </main>
  );
}

async function ProfessionalData({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await requireOwner();
  const [professional, services] = await Promise.all([loadProfessional(tenantId, id), listServiceOptions(tenantId)]);

  return (
    <>
      <PageHeader title={professional.name} overline="Profissional" back={{ href: "/painel/equipe", label: "Equipe" }} />
      <ProfessionalTabs professionalId={professional.id} current="dados" />
      <ProfessionalForm
        action={updateProfessionalAction.bind(null, professional.id)}
        services={services}
        defaults={{ name: professional.name, serviceIds: professional.serviceIds, active: professional.active }}
        submitLabel="Salvar dados"
      />
      <section className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 className="text-title-sm">Excluir profissional</h2>
        {professional.hasHistory ? (
          <Note>Este profissional já tem agendamentos. Para tirá-lo do link sem perder o histórico, desligue &quot;Atendendo&quot;.</Note>
        ) : (
          <DeleteForm
            action={deleteProfessionalAction.bind(null, professional.id)}
            label="Excluir profissional"
            confirmLabel="Toque de novo para excluir"
          />
        )}
      </section>
    </>
  );
}
