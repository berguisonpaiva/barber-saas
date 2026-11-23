import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { viewAppointmentByCancelLink } from "@/composition-root";
import { CancelFlow } from "@/components/booking/cancel-flow";
import { buttonVariants } from "@/components/ui/button";
import { getPublicTenant } from "@/modules/tenants/application/use-cases/get-public-tenant";
import { NotFoundError } from "@/shared/errors/app-error";

export const metadata: Metadata = { title: "Cancelar agendamento", robots: { index: false } };

/**
 * Tela C6 do Figma. O token chega na query (?token=) e é enviado para
 * POST /api/public/[slug]/appointments/cancel. Nunca registre o token em logs.
 */
export default function CancelPage({ params, searchParams }: PageProps<"/[slug]/cancelar">) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col">
      <Suspense fallback={<div className="m-6 h-80 animate-pulse rounded-2xl border border-line bg-surface" />}>
        <CancelContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function CancelContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, { token }] = await Promise.all([params, searchParams]);
  if (typeof token !== "string" || !token) return <InvalidLink slug={slug} />;
  await connection();

  let tenant;
  try {
    tenant = await getPublicTenant(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const view = await viewAppointmentByCancelLink.execute({ tenantId: tenant.id, token });
  if (!view) return <InvalidLink slug={slug} />;

  return (
    <CancelFlow
      slug={slug}
      token={token}
      details={{
        customerName: view.customerName,
        serviceName: view.serviceName,
        professionalName: view.professionalName,
        startsAt: view.startsAt.toISOString(),
        timeZone: view.timeZone,
        cancellationWindowMinutes: view.cancellationWindowMinutes,
        state: view.state,
      }}
    />
  );
}

function InvalidLink({ slug }: { slug: string }) {
  return (
    <section className="flex flex-1 flex-col justify-center gap-4 px-6 text-center">
      <h1 className="text-display-sm">Link inválido ou expirado</h1>
      <p className="text-body-md text-fg-muted">
        Este link de cancelamento não vale mais. Se precisar mudar o horário, fale com a barbearia.
      </p>
      <Link href={`/${slug}`} className={buttonVariants({ variant: "outline", block: true })}>
        Ver a barbearia
      </Link>
    </section>
  );
}
