import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DeleteForm } from "@/components/painel/delete-form";
import { PageHeader } from "@/components/painel/page-header";
import { ServiceForm } from "@/components/painel/service-form";
import { Note } from "@/components/ui/note";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { getServiceForEdit } from "@/modules/catalog/application/use-cases/get-service-for-edit";
import { deleteServiceAction, updateServiceAction } from "@/modules/catalog/presentation/actions/service-actions";
import { listOwnerProfessionals } from "@/modules/professionals/application/use-cases/list-owner-professionals";
import { NotFoundError } from "@/shared/errors/app-error";
import { parseEntityId } from "@/shared/forms/entity-id";
import { centsToPriceInput } from "@/shared/utils/money";

export const metadata: Metadata = { title: "Editar serviço" };

export default function EditarServicoPage({ params }: PageProps<"/painel/servicos/[id]">) {
  return (
    <main className="flex flex-col gap-6 px-6 pt-6">
      <PageHeader title="Editar serviço" back={{ href: "/painel/servicos", label: "Serviços" }} />
      <Suspense fallback={<div className="h-[520px] animate-pulse rounded-xl bg-surface" />}>
        <EditService params={params} />
      </Suspense>
    </main>
  );
}

async function loadService(tenantId: string, id: string) {
  try {
    return await getServiceForEdit(tenantId, parseEntityId(id, "Serviço não encontrado."));
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

async function EditService({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await requireOwner();
  const [service, professionals] = await Promise.all([loadService(tenantId, id), listOwnerProfessionals(tenantId)]);

  return (
    <>
      <ServiceForm
        action={updateServiceAction.bind(null, service.id)}
        professionals={professionals}
        defaults={{
          name: service.name,
          description: service.description ?? "",
          price: centsToPriceInput(service.priceCents),
          durationMinutes: service.durationMinutes,
          professionalIds: service.professionalIds,
          active: service.active,
        }}
        submitLabel="Salvar alterações"
      />
      <section className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 className="text-title-sm">Excluir serviço</h2>
        {service.hasHistory ? (
          <Note>
            Este serviço já tem agendamentos. Para tirá-lo do link sem perder o histórico, desligue &quot;Disponível
            online&quot;.
          </Note>
        ) : (
          <DeleteForm
            action={deleteServiceAction.bind(null, service.id)}
            label="Excluir serviço"
            confirmLabel="Toque de novo para excluir"
          />
        )}
      </section>
    </>
  );
}
