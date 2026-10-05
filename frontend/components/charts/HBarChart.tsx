"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import ChartTooltip from "@/components/charts/ChartTooltip";
import { COLOR } from "@/constants/theme";
import { tonnes } from "@/lib/format";

export interface HBarDatum {
  label: string;
  group?: string;
  value: number; // kg CO2e
  color?: string;
}

/** Single-measure horizontal bars: thin, 4px rounded data-end, value at the tip. */
export default function HBarChart({ data, color, seriesName }: { data: HBarDatum[]; color: string; seriesName: string }) {
  const height = Math.max(160, data.length * 38 + 30);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 8 }} barCategoryGap={8}>
        <CartesianGrid horizontal={false} stroke={COLOR.grid} />
        <XAxis
          type="number" tickFormatter={(v) => tonnes(v, false)} stroke={COLOR.axis}
          tick={{ fill: COLOR.muted, fontSize: 11 }} tickLine={false}
        />
        <YAxis
          type="category" dataKey="label" width={150} stroke={COLOR.axis} tickLine={false}
          tick={{ fill: COLOR.ink2, fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          content={<ChartTooltip format={(v) => `${tonnes(v)} CO₂e/yr`} labelFormat={(l, p) => (p?.group ? `${p.group} · ${l}` : String(l))} />}
        />
        <Bar dataKey="value" name={seriesName} fill={color} barSize={18} radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.label} fill={d.color ?? color} />)}
          <LabelList dataKey="value" position="right" formatter={(v: unknown) => tonnes(Number(v))} fill={COLOR.ink2} fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
