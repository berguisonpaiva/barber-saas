import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotFoundError } from "@/shared/errors/app-error";
import { formatBRL } from "@/shared/utils/money";
import { getPublicTenant } from "@/modules/tenants/application/use-cases/get-public-tenant";
import { listPublicServices } from "@/modules/catalog/application/use-cases/list-public-services";

/** RF-08: página pública da barbearia (tela C1 do Figma). */
export default function BarbershopPage({ params }: PageProps<"/[slug]">) {
  return (
    <main className="mx-auto min-h-dvh max-w-md">
      <Suspense fallback={<div className="h-[330px] animate-pulse bg-surface" />}>
        <Barbershop params={params} />
      </Suspense>
    </main>
  );
}

async function Barbershop({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connection();
  let tenant;
  try {
    tenant = await getPublicTenant(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  const services = await listPublicServices(tenant.id);

  return (
    <>
      <header className="relative flex h-[300px] flex-col justify-end overflow-hidden bg-gradient-to-b from-oxblood/60 to-canvas px-6 pb-5">
        {tenant.coverUrl ? <CoverBackdrop src={tenant.coverUrl} /> : null}
        <div className="relative flex flex-col gap-2">
          <p className="text-overline text-fg-accent">Barbearia</p>
          <h1 className="text-display-lg">{tenant.name}</h1>
          {tenant.address ? (
            <p className="flex items-center gap-1 text-body-md text-fg-muted">
              <MapPin className="size-4" /> {tenant.address}
            </p>
          ) : null}
          {!tenant.bookingEnabled ? <Badge tone="danger">Agendamento online indisponível</Badge> : null}
        </div>
      </header>
      <section className="flex flex-col gap-3 px-6 pb-10 pt-5">
        <h2 className="text-title-lg">Serviços</h2>
        {services.map((s) => (
          <article key={s.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4">
            <div className="flex-1">
              <h3 className="text-title-sm">{s.name}</h3>
              <p className="flex items-center gap-1 text-body-sm text-fg-muted">
                <Clock className="size-3.5" /> {s.durationMinutes} min
              </p>
            </div>
            <p className="text-title-sm">{formatBRL(s.priceCents)}</p>
          </article>
        ))}
        {/* TODO(RF-10): fluxo C2–C5 (profissional → data/horário → dados → comprovante) consumindo /api/public/[slug]/* */}
      </section>
    </>
  );
}

function CoverBackdrop({ src }: { src: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- capa vem do storage S3 público, sem otimizador de imagem configurado */}
      <img src={src} alt="" aria-hidden className="absolute inset-0 size-full object-cover" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-canvas/10 via-canvas/50 to-canvas" />
    </>
  );
}
