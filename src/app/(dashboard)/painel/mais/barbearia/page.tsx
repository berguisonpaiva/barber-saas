import type { Metadata } from "next";
import { Suspense } from "react";
import { BarbeariaSettingsForm } from "@/components/painel/barbearia-settings-form";
import { CoverUploader } from "@/components/painel/cover-uploader";
import { PageHeader } from "@/components/painel/page-header";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { getBarbeariaCover } from "@/modules/tenants/application/use-cases/get-barbearia-cover";
import { getBookingLink } from "@/modules/tenants/application/use-cases/get-booking-link";
import { getBarbeariaSettings } from "@/modules/tenants/application/use-cases/manage-barbearia-settings";
import { updateBarbeariaSettingsAction } from "@/modules/tenants/presentation/actions/barbearia-actions";
import { timeZoneOptions } from "@/modules/tenants/presentation/schemas/barbearia-settings";
import { formatBrazilPhone } from "@/shared/utils/phone";

export const metadata: Metadata = { title: "Dados da barbearia" };

export default function DadosDaBarbeariaPage() {
  return (
    <main className="flex flex-col gap-6 px-6 pt-6">
      <PageHeader title="Dados da barbearia" back={{ href: "/painel/mais", label: "Mais" }} />
      <Suspense fallback={<div className="h-[720px] animate-pulse rounded-xl bg-surface" />}>
        <Settings />
      </Suspense>
      <section className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 className="text-title-sm">Foto de capa</h2>
        <Suspense fallback={<div className="aspect-video animate-pulse rounded-2xl border border-line bg-surface" />}>
          <Cover />
        </Suspense>
      </section>
    </main>
  );
}

async function Settings() {
  const { tenantId } = await requireOwner();
  const [settings, link] = await Promise.all([getBarbeariaSettings(tenantId), getBookingLink(tenantId)]);
  return (
    <BarbeariaSettingsForm
      action={updateBarbeariaSettingsAction}
      timeZones={timeZoneOptions(settings.timezone)}
      bookingUrl={link.url}
      defaults={{
        name: settings.name,
        address: settings.address ?? "",
        phone: settings.phone ? formatBrazilPhone(settings.phone) : "",
        timezone: settings.timezone,
        slotIntervalMinutes: settings.slotIntervalMinutes,
        minAdvanceMinutes: settings.minAdvanceMinutes,
        maxAdvanceDays: settings.maxAdvanceDays,
        cancellationWindowMinutes: settings.cancellationWindowMinutes,
      }}
    />
  );
}

async function Cover() {
  const { tenantId } = await requireOwner();
  const { shopName, coverUrl } = await getBarbeariaCover(tenantId);
  return <CoverUploader shopName={shopName} initialCoverUrl={coverUrl} />;
}
