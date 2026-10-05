"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import ChartTooltip from "@/components/charts/ChartTooltip";
import { useChartColors } from "@/contexts/ThemeContext";
import { tonnes } from "@/lib/format";

export interface LineSeries {
  key: string;
  name: string;
  color: string;
}

/** Multi-line chart over years; crosshair tooltip, 2px lines, end-dot + end label per series. */
export default function ScenarioChart({ data, series, height = 260 }: {
  data: Record<string, number>[];
  series: LineSeries[];
  height?: number;
}) {
  const c = useChartColors();
  const last = data[data.length - 1];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 12, right: 72, bottom: 4, left: 8 }}>
        <CartesianGrid vertical={false} stroke={c.grid} />
        <XAxis dataKey="year" stroke={c.axis} tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} />
        <YAxis
          tickFormatter={(v) => tonnes(v, false)} stroke={c.axis} width={52}
          tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false}
        />
        <Tooltip
          cursor={{ stroke: c.muted, strokeWidth: 1 }}
          content={<ChartTooltip format={(v) => `${tonnes(v)} CO₂e`} />}
        />
        {series.map((s) => (
          <Line
            key={s.key} dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} isAnimationActive={false}
            dot={false} activeDot={{ r: 5, stroke: c.surface, strokeWidth: 2 }}
            label={(props: { index?: number; x?: number | string; y?: number | string }) =>
              props.index === data.length - 1 && last?.[s.key] != null ? (
                <g key={`${s.key}-end`}>
                  <circle cx={Number(props.x)} cy={Number(props.y)} r={4} fill={s.color} stroke={c.surface} strokeWidth={2} />
                  <text x={Number(props.x) + 8} y={Number(props.y) + 4} fill={c.ink2} fontSize={11}>
                    {tonnes(last[s.key])}
                  </text>
                </g>
              ) : <g key={`${s.key}-${props.index}`} />
            }
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
