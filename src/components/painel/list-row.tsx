import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

type ListRowProps = { href: Route; title: string; subtitle?: ReactNode; leading?: ReactNode; trailing?: ReactNode };

/** Componente "ListItem" do Figma: linha tocável com ícone/avatar, título, subtítulo e selo. */
export function ListRow({ href, title, subtitle, leading, trailing }: ListRowProps) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 hover:bg-raised">
      {leading}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-title-sm">{title}</span>
        {subtitle ? <span className="truncate text-body-sm text-fg-muted">{subtitle}</span> : null}
      </span>
      {trailing}
      <ChevronRight className="size-5 shrink-0 text-fg-muted" aria-hidden />
    </Link>
  );
}
