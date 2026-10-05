"use client";

/** Dark tooltip shared by every Recharts chart. Text stays in ink tokens; the swatch carries identity. */
export default function ChartTooltip({
  active, payload, label, format, labelFormat,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; payload?: Record<string, unknown>; dataKey?: string }[];
  label?: string | number;
  format: (v: number) => string;
  labelFormat?: (l: string | number, p?: Record<string, unknown>) => string;
}) {
  if (!active || !payload?.length) return null;
  const title = labelFormat ? labelFormat(label ?? "", payload[0]?.payload) : label;
  return (
    <div className="rounded-xl border border-white/10 bg-[#07130d]/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {title !== undefined && title !== "" && <p className="mb-1.5 font-semibold text-ink">{title}</p>}
      <ul className="space-y-1">
        {payload.map((p) => (
          <li key={String(p.dataKey ?? p.name)} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
            <span className="text-ink-2">{p.name}</span>
            <span className="tabular ml-auto pl-4 font-medium text-ink">{format(Number(p.value))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
