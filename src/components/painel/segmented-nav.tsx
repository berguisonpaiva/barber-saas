import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/shared/utils/cn";

type Segment = { href: Route; label: string; active: boolean };

/** Componente "Segmented" do Figma como navegação entre abas de uma mesma entidade. */
export function SegmentedNav({ segments, label }: { segments: Segment[]; label: string }) {
  return (
    <nav aria-label={label} className="flex rounded-full border border-line bg-surface p-1">
      {segments.map((segment) => (
        <Link
          key={segment.href}
          href={segment.href}
          aria-current={segment.active ? "page" : undefined}
          className={cn(
            "flex min-h-11 flex-1 items-center justify-center rounded-full text-label-md",
            segment.active ? "bg-accent text-on-accent" : "text-fg-muted",
          )}
        >
          {segment.label}
        </Link>
      ))}
    </nav>
  );
}
