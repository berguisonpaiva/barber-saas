import { cn } from "@/shared/utils/cn";

export type Segment = { key: string; label: string; value: number; colorClass: string };

const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });

/**
 * Uma parte do todo: barra fina segmentada (8px, pontas arredondadas, 2px de superfície entre as partes, sem texto),
 * com legenda de nomes, quantidades e participação — a identidade nunca depende só da cor.
 */
export function SegmentedBar({ title, segments }: { title: string; segments: Segment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const visible = segments.filter((segment) => segment.value > 0);

  return (
    <figure className="flex flex-col gap-3">
      <div
        role="img"
        aria-label={`${title}: ${segments.map((s) => `${s.label} ${s.value}`).join(", ")}`}
        className={cn("flex h-2 w-full gap-0.5 overflow-hidden rounded-full", !visible.length && "bg-muted")}
      >
        {visible.map((segment) => (
          <span key={segment.key} className={cn("h-full", segment.colorClass)} style={{ flexGrow: segment.value }} />
        ))}
      </div>
      <ul className="flex flex-col gap-2">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2 text-body-sm">
            <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", segment.colorClass)} />
            <span className="min-w-0 flex-1 truncate text-fg-muted">{segment.label}</span>
            <span className="text-fg tabular-nums">
              {segment.value}
              <span className="text-fg-muted"> · {percent.format(total ? segment.value / total : 0)}</span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
