import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, Store, UserRound } from "lucide-react";
import { BookingLinkCard } from "@/components/painel/booking-link-card";
import { PushManager } from "@/components/painel/push-manager";
import { Button } from "@/components/ui/button";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { logoutAction } from "@/modules/identity/presentation/actions/auth-actions";
import { getBookingLink } from "@/modules/tenants/application/use-cases/get-booking-link";

export const metadata: Metadata = { title: "Mais" };

// TODO(P8): assinatura, regras de agendamento, demais dados da barbearia (nome, endereço, fuso).
export default function MaisPage() {
  return (
    <main className="flex flex-col gap-6 px-6 pt-6">
      <Suspense fallback={<BarbeariaSkeleton />}>
        <Barbearia />
      </Suspense>
      <Link
        href="/painel/mais/barbearia"
        className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4"
      >
        <span className="grid size-10 place-items-center rounded-lg bg-muted">
          <Store className="size-5" aria-hidden />
        </span>
        <span className="flex flex-1 flex-col">
          <span className="text-title-sm">Dados da barbearia</span>
          <span className="text-body-sm text-fg-muted">Nome, endereço, fuso, regras e capa</span>
        </span>
        <ChevronRight className="size-5 text-fg-muted" aria-hidden />
      </Link>
      <Link
        href="/painel/mais/clientes"
        className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4"
      >
        <span className="grid size-10 place-items-center rounded-lg bg-muted">
          <UserRound className="size-5" aria-hidden />
        </span>
        <span className="flex flex-1 flex-col">
          <span className="text-title-sm">Clientes</span>
          <span className="text-body-sm text-fg-muted">Histórico e contato</span>
        </span>
        <ChevronRight className="size-5 text-fg-muted" aria-hidden />
      </Link>
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
        <h2 className="text-title-sm">Notificações</h2>
        <PushManager />
      </section>
      <form action={logoutAction}>
        <Button variant="outline" block>
          Sair da conta
        </Button>
      </form>
    </main>
  );
}

async function Barbearia() {
  const { tenantId } = await requireOwner();
  const { shopName, url } = await getBookingLink(tenantId);
  return (
    <>
      <MaisHeader shopName={shopName} />
      <BookingLinkCard shopName={shopName} url={url} />
    </>
  );
}

function MaisHeader({ shopName }: { shopName?: string }) {
  return (
    <header className="flex flex-col gap-1">
      <p className="min-h-4 text-overline text-fg-accent">{shopName}</p>
      <h1 className="text-display-sm">Mais</h1>
    </header>
  );
}

function BarbeariaSkeleton() {
  return (
    <>
      <MaisHeader />
      <div className="h-36 animate-pulse rounded-2xl border border-line bg-surface" />
    </>
  );
}
