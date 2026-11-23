"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Menu, Scissors, Users } from "lucide-react";
import { cn } from "@/shared/utils/cn";

const tabs = [
  { href: "/painel/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/painel/servicos", label: "Serviços", icon: Scissors },
  { href: "/painel/equipe", label: "Equipe", icon: Users },
  { href: "/painel/mais", label: "Mais", icon: Menu },
] as const;

/** Componente "BottomNav" do Figma: pílula flutuante, aba ativa dourada com rótulo. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-2">
      <ul className="mx-auto flex max-w-md items-center justify-between rounded-full border border-line bg-raised p-1.5 shadow-floating">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
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
