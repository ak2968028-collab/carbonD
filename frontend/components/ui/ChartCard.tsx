"use client";

import { useState } from "react";
import Image from "next/image";
import { BarChart3, Table2 } from "lucide-react";

export interface TableData {
  columns: string[];
  rows: (string | number)[][];
}

interface Props {
  title: string;
  subtitle?: string;
  photo?: string;
  legend?: React.ReactNode;
  table?: TableData;
  className?: string;
  children: React.ReactNode;
}

/** Card wrapper for a chart, with an optional photo thumbnail and a chart/table toggle. */
export default function ChartCard({ title, subtitle, photo, legend, table, className = "", children }: Props) {
  const [showTable, setShowTable] = useState(false);

  return (
    <section className={`card flex flex-col overflow-hidden ${className}`}>
      <header className="flex items-start gap-3 p-5 pb-3">
        {photo && (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
            <Image src={photo} alt="" fill className="object-cover" sizes="48px" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
        </div>
        {table && (
          <button
            onClick={() => setShowTable((s) => !s)}
            className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-ink-2 hover:bg-white/5"
            aria-pressed={showTable}
          >
            {showTable ? <BarChart3 className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
            {showTable ? "Chart" : "Table"}
          </button>
        )}
      </header>
      {legend && !showTable && <div className="px-5 pb-2">{legend}</div>}
      <div className="flex-1 px-3 pb-4">
        {showTable && table ? <DataTable {...table} /> : children}
      </div>
    </section>
  );
}

export function DataTable({ columns, rows }: TableData) {
  return (
    <div className="max-h-[320px] overflow-auto px-2">
      <table className="tabular w-full text-sm">
        <thead className="sticky top-0 bg-surface">
          <tr>
            {columns.map((c, i) => (
              <th key={c} className={`border-b border-line py-2 font-medium text-muted ${i ? "text-right" : "text-left"}`}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/60">
              {r.map((v, j) => (
                <td key={j} className={`py-2 ${j ? "text-right text-ink" : "text-left text-ink-2"}`}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; line?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span
            className={i.line ? "h-[2px] w-4 rounded" : "h-2.5 w-2.5 rounded-sm"}
            style={{ background: i.color }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
