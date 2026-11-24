"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChartColumn, Menu, Scissors, Users } from "lucide-react";
import { cn } from "@/shared/utils/cn";

const tabs = [
  { href: "/painel/resumo", label: "Resumo", icon: ChartColumn },
  { href: "/painel/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/painel/servicos", label: "Serviços", icon: Scissors },
  { href: "/painel/equipe", label: "Equipe", icon: Users },
  { href: "/painel/mais", label: "Mais", icon: Menu },
] as const;

/**
 * Lê a URL atual; em rotas com parâmetro dinâmico ([id]) isso só existe em tempo de execução,
 * então o layout a envolve em <Suspense> com BottomNavFallback (Cache Components).
 */
export function BottomNav() {
  return <BottomNavBar pathname={usePathname()} />;
}

/** A mesma barra, sem aba ativa, enquanto a URL não chega. */
export function BottomNavFallback() {
  return <BottomNavBar pathname={null} />;
}

/** Componente "BottomNav" do Figma: pílula flutuante, aba ativa dourada com rótulo. */
function BottomNavBar({ pathname }: { pathname: string | null }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-2">
      <ul className="mx-auto flex max-w-md items-center justify-between rounded-full border border-line bg-raised p-1.5 shadow-floating">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href) ?? false;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[52px] items-center justify-center gap-2 rounded-full",
                  active ? "bg-accent px-5 text-on-accent" : "w-[52px] text-fg-muted",
                )}
              >
                <Icon className="size-[22px]" />
                {active ? <span className="text-label-md">{label}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
