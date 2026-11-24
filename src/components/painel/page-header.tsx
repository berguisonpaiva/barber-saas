import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

type PageHeaderProps = {
  title: string;
  overline?: ReactNode;
  back?: { href: Route; label: string };
  action?: ReactNode;
};

/** Componente "AppBar" do Figma: voltar opcional, sobretítulo, título e ação à direita. */
export function PageHeader({ title, overline, back, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      {back ? (
        <Link href={back.href} className="flex min-h-11 items-center gap-1 self-start text-label-md text-fg-muted">
          <ChevronLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      ) : null}
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          {overline ? <p className="min-h-4 text-overline text-fg-accent">{overline}</p> : null}
          <h1 className="truncate text-display-sm">{title}</h1>
        </div>
        {action}
      </div>
    </header>
  );
}
