export type BarItem = { key: string; label: string; value: number; display: string };

/**
 * Barras horizontais de uma série: nome acima, barra (≤ 24px, ponta arredondada 4px, base reta)
 * e o valor logo após a ponta, em cor de texto. Lista acessível: cada item lê "nome: valor".
 */
export function BarList({ title, items, empty }: { title: string; items: BarItem[]; empty: string }) {
  if (!items.length) return <p className="text-body-sm text-fg-muted">{empty}</p>;

  const max = Math.max(...items.map((item) => item.value));
  return (
    <ol className="flex flex-col gap-3" aria-label={title}>
      {items.map((item) => (
        <li key={item.key} className="flex flex-col gap-1">
          <span className="truncate text-body-sm text-fg">{item.label}</span>
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-3 shrink-0 rounded-r-[4px] bg-chart"
              style={{ width: `calc((100% - 5.5rem) * ${max ? item.value / max : 0})`, minWidth: item.value ? 2 : 0 }}
            />
            <span className="shrink-0 text-body-sm text-fg-muted tabular-nums">
              <span className="sr-only">{item.label}: </span>
              {item.display}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
