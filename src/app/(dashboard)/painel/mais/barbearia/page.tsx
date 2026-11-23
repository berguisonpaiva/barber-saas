import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { CoverUploader } from "@/components/painel/cover-uploader";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { getBarbeariaCover } from "@/modules/tenants/application/use-cases/get-barbearia-cover";

export const metadata: Metadata = { title: "Dados da barbearia" };

export default function DadosDaBarbeariaPage() {
  return (
    <main className="flex flex-col gap-6 px-6 pt-6">
      <header className="flex flex-col gap-3">
        <Link href="/painel/mais" className="flex items-center gap-1 text-label-md text-fg-muted">
          <ChevronLeft className="size-4" aria-hidden />
          Mais
        </Link>
        <h1 className="text-display-sm">Dados da barbearia</h1>
      </header>
      <section className="flex flex-col gap-3">
        <h2 className="text-title-sm">Foto de capa</h2>
        <Suspense fallback={<div className="aspect-video animate-pulse rounded-2xl border border-line bg-surface" />}>
          <Cover />
        </Suspense>
      </section>
    </main>
  );
}

async function Cover() {
  const { tenantId } = await requireOwner();
  const { shopName, coverUrl } = await getBarbeariaCover(tenantId);
  return <CoverUploader shopName={shopName} initialCoverUrl={coverUrl} />;
}
