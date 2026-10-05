"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import ChartTooltip from "@/components/charts/ChartTooltip";
import { COLOR } from "@/constants/theme";

export interface GroupSeries {
  key: string;
  name: string;
  color: string;
}

/** Categories down the side, one thin bar per series (village) in each group. */
export default function GroupedBarChart({ data, series, format, categoryWidth = 130 }: {
  data: Record<string, string | number>[];
  series: GroupSeries[];
  format: (v: number) => string;
  categoryWidth?: number;
}) {
  const barSize = series.length > 2 ? 10 : 14;
  const height = Math.max(180, data.length * (series.length * (barSize + 2) + 22) + 30);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }} barGap={2}>
        <CartesianGrid horizontal={false} stroke={COLOR.grid} />
        <XAxis
          type="number" tickFormatter={(v) => format(v)} stroke={COLOR.axis}
          tick={{ fill: COLOR.muted, fontSize: 11 }} tickLine={false}
        />
        <YAxis
          type="category" dataKey="label" width={categoryWidth} stroke={COLOR.axis} tickLine={false}
          tick={{ fill: COLOR.ink2, fontSize: 12 }}
        />
        <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTooltip format={format} />} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} barSize={barSize} radius={[0, 4, 4, 0]} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
