"use client";

import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import ChartTooltip from "@/components/charts/ChartTooltip";
import HBarChart from "@/components/charts/HBarChart";
import ScenarioChart from "@/components/charts/ScenarioChart";
import ChartCard, { DataTable, Legend } from "@/components/ui/ChartCard";
import { SCENARIOS } from "@/constants/theme";
import { useChartColors } from "@/contexts/ThemeContext";
import type { EmissionFactor, VillageDetail } from "@/interface/types";
import { num, tonnes } from "@/lib/format";

export function scenarioRows(village: VillageDetail) {
  const byYear = new Map<number, Record<string, number>>();
  for (const p of village.scenarios) {
    const row = byYear.get(p.year) ?? { year: p.year };
    row[p.scenario] = p.emission_kg;
    byYear.set(p.year, row);
  }
  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

export default function VillageCarbon({ village, factors }: { village: VillageDetail; factors: EmissionFactor[] }) {
  const c = useChartColors();
  if (!village.has_carbon_data) return <NoAssessment name={village.name} />;

  const emissions = village.emissions.map((e) => ({ label: e.source, group: e.sector, value: e.emission_kg }));
  const interventions = village.interventions.map((i) => ({ label: i.name, group: i.sector, value: i.reduction_kg }));
  const sinks = village.sequestration
    .filter((s) => s.co2_kg > 0)
    .map((s) => ({
      label: s.measure + (s.area_ha ? ` (${num(s.area_ha, 1)} ha)` : ""),
      value: s.co2_kg,
      color: s.phase === "before" ? c.existing : c.reduction,
    }));
  const scenarios = scenarioRows(village);
  const scenarioKeys = Object.keys(SCENARIOS).filter((k) => village.scenarios.some((s) => s.scenario === k));
  const totalEmission = village.emissions.reduce((s, e) => s + e.emission_kg, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard
        title="Where emissions come from"
        subtitle={`${tonnes(totalEmission)} CO₂e per year, by source`}
        photo="/images/emissions.webp"
        table={{ columns: ["Source", "Sector", "t CO₂e/yr"], rows: village.emissions.map((e) => [e.source, e.sector, num(e.emission_kg / 1000)]) }}
      >
        <HBarChart data={emissions} color={c.emission} seriesName="Emissions" />
      </ChartCard>

      <ChartCard
        title="Emission pathways to 2035"
        subtitle="Projected net emissions, t CO₂e per year"
        photo="/images/roots.webp"
        legend={<Legend items={scenarioKeys.map((k) => ({ label: SCENARIOS[k].long, color: c.scenario[k], line: true }))} />}
        table={{
          columns: ["Year", ...scenarioKeys],
          rows: scenarios.map((r) => [r.year, ...scenarioKeys.map((k) => num((r[k] ?? 0) / 1000))]),
        }}
      >
        <ScenarioChart data={scenarios} series={scenarioKeys.map((k) => ({ key: k, name: SCENARIOS[k].long, color: c.scenario[k] }))} />
      </ChartCard>

      <ChartCard
        title="Interventions that cut emissions"
        subtitle="Annual reduction potential, t CO₂e"
        photo="/images/seaweed.webp"
        table={{ columns: ["Intervention", "Sector", "t CO₂e/yr"], rows: village.interventions.map((i) => [i.name, i.sector, num(i.reduction_kg / 1000, 1)]) }}
      >
        <HBarChart data={interventions} color={c.reduction} seriesName="Reduction" />
      </ChartCard>

      <ChartCard
        title="Carbon sinks"
        subtitle="CO₂ absorbed per year: existing cover vs planned measures"
        photo="/images/sapling.webp"
        legend={<Legend items={[{ label: "Existing", color: c.existing }, { label: "Planned", color: c.reduction }]} />}
        table={{
          columns: ["Measure", "Status", "Area (ha)", "t CO₂/yr"],
          rows: village.sequestration.map((s) => [s.measure, s.phase === "before" ? "Existing" : "Planned", s.area_ha != null ? num(s.area_ha, 1) : "—", num(s.co2_kg / 1000, 1)]),
        }}
      >
        <HBarChart data={sinks} color={c.reduction} seriesName="Sequestration" />
      </ChartCard>

      <BalanceWaterfall village={village} />

      <div className="grid gap-5">
        <ChartCard title="Activity data" subtitle="Inputs the emission estimates are built from">
          <DataTable
            columns={["Activity", "Value", "Unit"]}
            rows={village.activities.map((a) => [a.activity, a.value != null ? num(a.value, 1) : "—", a.unit])}
          />
        </ChartCard>
        {factors.length > 0 && (
          <ChartCard title="Emission factors" subtitle="Reference factors used in the inventory">
            <DataTable columns={["Category", "Factor", "Source"]} rows={factors.map((f) => [f.category, f.emission_factor, f.source ?? "—"])} />
          </ChartCard>
        )}
      </div>
    </div>
  );
}

/** Baseline → minus cuts → minus new sinks → net after; flags source figures that don't add up. */
function BalanceWaterfall({ village }: { village: VillageDetail }) {
  const c = useChartColors();
  const b = village.budget!;
  const baseline = b.previous_net_emission ?? b.net_emission_before ?? 0;
  const cuts = b.emission_reduction ?? 0;
  const sinks = b.sequestration_increase ?? 0;
  const after = b.net_emission_after ?? 0;
  const implied = baseline - cuts - sinks;
  const reconciles = Math.abs(implied - after) <= Math.max(1, baseline * 0.01);

  const data = [
    { label: "Baseline net", base: 0, value: baseline, color: c.neutral },
    { label: "Emission cuts", base: baseline - cuts, value: cuts, color: c.reduction, neg: true },
    { label: "New sinks", base: Math.max(baseline - cuts - sinks, 0), value: sinks, color: c.reduction, neg: true },
    { label: "Net after", base: 0, value: after, color: c.neutral },
  ].map((d) => ({ ...d, display: `${d.neg ? "−" : ""}${tonnes(d.value)}` }));

  return (
    <ChartCard
      className="self-start"
      title="Carbon balance"
      subtitle="From today's net emissions to the post-intervention net, t CO₂e per year"
      table={{ columns: ["Step", "t CO₂e/yr"], rows: data.map((d) => [d.label, `${d.neg ? "−" : ""}${num(d.value / 1000)}`]) }}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 22, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="label" stroke={c.axis} tick={{ fill: c.ink2, fontSize: 12 }} tickLine={false} />
          <YAxis tickFormatter={(v) => tonnes(v, false)} stroke={c.axis} width={52} tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: c.cursor }}
            content={({ active, payload, label }) => (
              <ChartTooltip
                active={active} label={label} format={(v) => `${tonnes(v)} CO₂e`}
                payload={payload?.filter((p) => p.dataKey === "value").map((p) => ({
                  dataKey: "value", name: String(label), value: Number(p.value), color: (p.payload as { color: string }).color,
                }))}
              />
            )}
          />
          <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="value" stackId="w" barSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((d) => <Cell key={d.label} fill={d.color} />)}
            <LabelList dataKey="display" position="top" fill={c.ink2} fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {!reconciles && (
        <p className="mx-2 mt-2 flex items-start gap-2 rounded-lg border border-warn-line bg-warn-soft px-3 py-2 text-xs text-warn-text">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Source figures don&apos;t reconcile: baseline minus cuts and new sinks gives {tonnes(implied)}, but budget.csv reports {tonnes(after)} after interventions.
        </p>
      )}
    </ChartCard>
  );
}

function NoAssessment({ name }: { name: string }) {
  return (
    <section className="card theme-dark relative overflow-hidden">
      <Image src="/images/roots.webp" alt="" fill className="object-cover opacity-30" sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#07130d] via-[#07130d]/90 to-[#07130d]/40" />
      <div className="relative max-w-xl p-8">
        <p className="text-lg font-semibold text-ink">No carbon assessment for {name} yet</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          The boundary and census profile come from the village layer. Emission, sink and pathway figures appear here
          once this village is added to the carbon inventory (media/Data/*.csv).
        </p>
      </div>
    </section>
  );
}
