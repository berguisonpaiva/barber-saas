import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, Users } from "lucide-react";
import { ActiveSwitch } from "@/components/painel/active-switch";
import { EmptyState } from "@/components/painel/empty-state";
import { PageHeader } from "@/components/painel/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireOwner } from "@/modules/identity/application/require-owner";
import { listOwnerProfessionals } from "@/modules/professionals/application/use-cases/list-owner-professionals";
import { setProfessionalActiveAction } from "@/modules/professionals/presentation/actions/professional-actions";
import { WEEKDAY_ORDER, WEEKDAY_SHORT } from "@/shared/time/format";

export const metadata: Metadata = { title: "Equipe" };

/** Tela P5: profissionais (sem login), com ativar/desativar (RF-05). */
export default function EquipePage() {
  return (
    <main className="flex flex-col gap-6 px-6 pt-6">
      <PageHeader
        title="Equipe"
        overline="Profissionais"
        action={
          <Link href="/painel/equipe/novo" className={buttonVariants({ size: "md" })}>
            <Plus aria-hidden />
            Novo
          </Link>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <TeamList />
      </Suspense>
    </main>
  );
}

/** "Seg a Sáb" quando os dias são seguidos (na semana do painel); senão "Seg · Qua · Sex". */
function workingDaysLabel(days: number[]): string {
  if (!days.length) return "Sem expediente";
  const ordered = WEEKDAY_ORDER.filter((day) => days.includes(day));
  const positions = ordered.map((day) => WEEKDAY_ORDER.indexOf(day));
  const consecutive = positions.every((position, i) => i === 0 || position === positions[i - 1] + 1);
  if (consecutive && ordered.length >= 3) {
    return `${WEEKDAY_SHORT[ordered[0]]} a ${WEEKDAY_SHORT[ordered[ordered.length - 1]]}`;
  }
  return ordered.map((day) => WEEKDAY_SHORT[day]).join(" · ");
}

async function TeamList() {
  const { tenantId } = await requireOwner();
  const professionals = await listOwnerProfessionals(tenantId);

  if (!professionals.length) {
    return (
      <EmptyState
        icon={<Users aria-hidden />}
        title="Nenhum profissional ainda"
        text="Cadastre quem atende na barbearia e defina o expediente de cada um."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {professionals.map((professional) => (
        <li key={professional.id} className="flex items-center gap-2 rounded-xl border border-line bg-surface py-2 pl-4 pr-2">
          <Link href={`/painel/equipe/${professional.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-2">
            <Avatar name={professional.name} muted={!professional.active} />
            <span className="flex min-w-0 flex-col">
              <span className={professional.active ? "truncate text-title-sm" : "truncate text-title-sm text-fg-muted"}>
                {professional.name}
              </span>
              <span className="truncate text-body-sm text-fg-muted">
                {professional.serviceCount === 1 ? "1 serviço" : `${professional.serviceCount} serviços`} ·{" "}
                {workingDaysLabel(professional.workingDays)}
              </span>
              {professional.active && (!professional.workingDays.length || !professional.serviceCount) ? (
                <Badge tone="danger" className="mt-2 self-start">
                  {professional.workingDays.length ? "Sem serviços" : "Sem expediente"}: fora do link
                </Badge>
              ) : null}
            </span>
          </Link>
          <ActiveSwitch
            active={professional.active}
            label={`${professional.active ? "Desativar" : "Ativar"} ${professional.name}`}
            action={setProfessionalActiveAction.bind(null, professional.id)}
          />
        </li>
      ))}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-[80px] animate-pulse rounded-xl bg-surface" />
      ))}
    </div>
  );
}
