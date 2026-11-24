"use client";

import { useState } from "react";
import { cn } from "@/shared/utils/cn";

export type ColumnDetail = { label: string; value: string };

export type Column = {
  key: string;
  /** Rótulo curto do eixo (ex.: "23/11", "14h"). */
  axisLabel: string;
  /** Título do tooltip e da linha da tabela (ex.: "Seg, 23/11"). */
  label: string;
  value: number;
  /** Valores extras do tooltip e colunas extras da tabela (ex.: faturamento do dia). */
  details?: ColumnDetail[];
};

type ColumnChartProps = {
  title: string;
  columns: Column[];
  /** Unidade do valor (ex.: "agendamentos"). */
  unit: string;
  /** Mostra um rótulo de eixo a cada N colunas para não encavalar. */
  axisEvery?: number;
};

const PLOT_HEIGHT = 160;

/** Topo "redondo" do eixo y: 1 · 2 · 2,5 · 5 · 10 × 10^n, sempre ≥ ao máximo. */
export function niceMax(max: number): number {
  if (max <= 4) return Math.max(Math.ceil(max), 1);
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= max) ?? 10;
  return step * magnitude;
}

const describe = (column: Column, unit: string) =>
  [`${column.label}: ${column.value} ${unit}`, ...(column.details ?? []).map((d) => `${d.label} ${d.value}`)].join(", ");

/**
 * Colunas de uma série (cor única, sem legenda: o título diz o que é).
 * Coluna ≤ 24px, topo arredondado 4px e base reta; grade hairline; tooltip ao passar o mouse, tocar ou focar;
 * tabela com todos os valores para leitor de tela e para quem prefere ler números.
 */
export function ColumnChart({ title, columns, unit, axisEvery = 1 }: ColumnChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...columns.map((column) => column.value)));
  const ticks = [max, max / 2, 0];
  const activeColumn = active === null ? null : columns[active];
  const detailHeaders = columns[0]?.details?.map((detail) => detail.label) ?? [];

  return (
    <figure className="flex flex-col gap-3">
      <div className="relative" onMouseLeave={() => setActive(null)}>
        <div className="flex gap-2">
          <div
            aria-hidden
            className="flex w-7 shrink-0 flex-col justify-between text-right text-[11px] leading-none text-fg-muted tabular-nums"
            style={{ height: PLOT_HEIGHT }}
          >
            {ticks.map((tick) => (
              <span key={tick}>{Number.isInteger(tick) ? tick : tick.toFixed(1).replace(".", ",")}</span>
            ))}
          </div>
          <div className="relative min-w-0 flex-1">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between"
              style={{ height: PLOT_HEIGHT }}
            >
              {ticks.map((tick) => (
                <span key={tick} className="h-px w-full bg-line" />
              ))}
            </div>
            <ol className="relative flex items-end" style={{ height: PLOT_HEIGHT }} aria-label={title}>
              {columns.map((column, index) => (
                <li key={column.key} className="flex h-full min-w-0 flex-1">
                  <button
                    type="button"
                    aria-label={describe(column, unit)}
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                    onClick={() => setActive(index)}
                    className="flex h-full w-full items-end justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <span
                      className={cn(
                        "w-[60%] max-w-6 rounded-t-[4px] bg-chart transition-opacity",
                        active !== null && active !== index && "opacity-40",
                      )}
                      style={{ height: column.value ? `${Math.max((column.value / max) * 100, 1.5)}%` : 0 }}
                    />
                  </button>
                </li>
              ))}
            </ol>
            <ol aria-hidden className="mt-2 flex text-[11px] leading-none text-fg-muted">
              {columns.map((column, index) => (
                <li key={column.key} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center">
                  {index % axisEvery === 0 ? column.axisLabel : ""}
                </li>
              ))}
            </ol>
          </div>
        </div>
        {activeColumn ? (
          <div
            role="status"
            className="pointer-events-none absolute right-0 top-0 z-10 rounded-md border border-line bg-raised px-3 py-2 text-body-sm shadow-card"
          >
            <p className="font-semibold text-fg">{activeColumn.label}</p>
            <p className="text-fg-muted">
              {activeColumn.value} {unit}
            </p>
            {activeColumn.details?.map((detail) => (
              <p key={detail.label} className="text-fg-muted">
                {detail.label}: <span className="text-fg">{detail.value}</span>
              </p>
            ))}
          </div>
        ) : null}
      </div>
      <details className="text-body-sm text-fg-muted">
        <summary className="min-h-11 cursor-pointer content-center">Ver dados em tabela</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-2 font-semibold">
                Período
              </th>
              <th scope="col" className="py-2 text-right font-semibold first-letter:uppercase">
                {unit}
              </th>
              {detailHeaders.map((header) => (
                <th key={header} scope="col" className="py-2 text-right font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {columns.map((column) => (
              <tr key={column.key} className="border-b border-line">
                <th scope="row" className="py-2 font-normal">
                  {column.label}
                </th>
                <td className="py-2 text-right text-fg">{column.value}</td>
                {column.details?.map((detail) => (
                  <td key={detail.label} className="py-2 text-right text-fg">
                    {detail.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
