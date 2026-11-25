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

const isActive = (pathname: string | null, href: string) => pathname?.startsWith(href) ?? false;

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

/** Menu lateral do tablet (só ícones) e do computador (ícones e nomes); no celular fica a BottomNav. */
export function SideNav() {
  return <SideNavBar pathname={usePathname()} />;
}

export function SideNavFallback() {
  return <SideNavBar pathname={null} />;
}

/** Componente "BottomNav" do Figma: pílula flutuante, aba ativa dourada com rótulo. */
function BottomNavBar({ pathname }: { pathname: string | null }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-2 md:hidden">
      <ul className="mx-auto flex max-w-md items-center justify-between rounded-full border border-line bg-raised p-1.5 shadow-floating">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
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

function SideNavBar({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Painel"
      className="sticky top-0 hidden h-dvh w-20 shrink-0 flex-col gap-8 border-r border-line bg-surface px-3 py-6 md:flex lg:w-60 lg:px-4"
    >
      <Link href="/painel/agenda" className="flex items-center justify-center gap-3 lg:justify-start lg:px-2">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-on-accent">
          <Scissors className="size-5" />
        </span>
        <span className="sr-only text-title-md lg:not-sr-only">Barber</span>
      </Link>
      <ul className="flex flex-col gap-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                title={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-12 items-center justify-center gap-3 rounded-xl transition-colors lg:justify-start lg:px-3",
                  active ? "bg-accent text-on-accent" : "text-fg-muted hover:bg-muted hover:text-fg",
                )}
              >
                <Icon className="size-[22px] shrink-0" aria-hidden />
                <span className="sr-only text-label-md lg:not-sr-only">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
