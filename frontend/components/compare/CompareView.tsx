"use client";

import { useState } from "react";

import GroupedBarChart from "@/components/charts/GroupedBarChart";
import ScenarioChart from "@/components/charts/ScenarioChart";
import ChartCard, { Legend } from "@/components/ui/ChartCard";
import { SCENARIOS } from "@/constants/theme";
import type { CensusProperties, VillageDetail } from "@/interface/types";
import { num, pct, tonnes } from "@/lib/format";

export interface CompareEntry {
  village: VillageDetail;
  census: CensusProperties | null;
  color: string;
}

export default function CompareView({ entries }: { entries: CompareEntry[] }) {
  const [scenario, setScenario] = useState("BAU");
  const carbon = entries.filter((e) => e.village.has_carbon_data);
  const withoutCarbon = entries.filter((e) => !e.village.has_carbon_data);
  const series = carbon.map((e) => ({ key: e.village.vlcode, name: e.village.name, color: e.color }));
  const legend = <Legend items={carbon.map((e) => ({ label: e.village.name, color: e.color }))} />;

  // Emissions by sector: sum each village's sources per sector
  const sectors = [...new Set(carbon.flatMap((e) => e.village.emissions.map((s) => s.sector)))];
  const sectorRows = sectors.map((sector) => {
    const row: Record<string, string | number> = { label: sector };
    for (const e of carbon) row[e.village.vlcode] = e.village.emissions.filter((s) => s.sector === sector).reduce((t, s) => t + s.emission_kg, 0);
    return row;
  }).sort((a, b) => sumRow(b, series) - sumRow(a, series));

  const balanceRows = [
    { label: "Net today", pick: (v: VillageDetail) => v.budget?.net_emission_before ?? 0 },
    { label: "After interventions", pick: (v: VillageDetail) => v.budget?.net_emission_after ?? 0 },
  ].map(({ label, pick }) => {
    const row: Record<string, string | number> = { label };
    for (const e of carbon) row[e.village.vlcode] = pick(e.village);
    return row;
  });

  const names = [...new Set(carbon.flatMap((e) => e.village.interventions.map((i) => i.name)))];
  const interventionRows = names.map((name) => {
    const row: Record<string, string | number> = { label: name };
    for (const e of carbon) row[e.village.vlcode] = e.village.interventions.find((i) => i.name === name)?.reduction_kg ?? 0;
    return row;
  }).sort((a, b) => sumRow(b, series) - sumRow(a, series));

  const years = [...new Set(carbon.flatMap((e) => e.village.scenarios.map((s) => s.year)))].sort();
  const scenarioRows = years.map((year) => {
    const row: Record<string, number> = { year };
    for (const e of carbon) {
      const p = e.village.scenarios.find((s) => s.scenario === scenario && s.year === year);
      if (p) row[e.village.vlcode] = p.emission_kg;
    }
    return row;
  });

  return (
    <div className="space-y-5">
      <MetricsTable entries={entries} />

      {withoutCarbon.length > 0 && (
        <p className="rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-sm text-ink-2">
          {withoutCarbon.map((e) => e.village.name).join(", ")} {withoutCarbon.length === 1 ? "has" : "have"} no carbon
          assessment, so {withoutCarbon.length === 1 ? "it is" : "they are"} shown in the table and on the map only.
        </p>
      )}

      {carbon.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard
            title="Net emissions: today vs after interventions" subtitle="t CO₂e per year" legend={legend}
            table={{ columns: ["", ...carbon.map((e) => e.village.name)], rows: balanceRows.map((r) => [r.label as string, ...series.map((s) => num(Number(r[s.key]) / 1000))]) }}
          >
            <GroupedBarChart data={balanceRows} series={series} format={(v) => tonnes(v, false)} categoryWidth={140} />
          </ChartCard>

          <ChartCard
            title={`Pathway: ${SCENARIOS[scenario].long}`} subtitle="Projected net emissions, t CO₂e per year"
            legend={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Legend items={carbon.map((e) => ({ label: e.village.name, color: e.color, line: true }))} />
                <div className="flex rounded-lg border border-line p-0.5 text-xs">
                  {Object.entries(SCENARIOS).map(([k, s]) => (
                    <button
                      key={k} onClick={() => setScenario(k)} aria-pressed={scenario === k}
                      className={`rounded-md px-2.5 py-1 ${scenario === k ? "bg-white/10 text-ink" : "text-muted hover:text-ink"}`}
                      title={s.long}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            }
            table={{ columns: ["Year", ...carbon.map((e) => e.village.name)], rows: scenarioRows.map((r) => [r.year, ...series.map((s) => (r[s.key] != null ? num(r[s.key] / 1000) : "—"))]) }}
          >
            <ScenarioChart data={scenarioRows} series={series} />
          </ChartCard>

          <ChartCard
            title="Emissions by sector" subtitle="t CO₂e per year" legend={legend} photo="/images/emissions.webp"
            table={{ columns: ["Sector", ...carbon.map((e) => e.village.name)], rows: sectorRows.map((r) => [r.label as string, ...series.map((s) => num(Number(r[s.key]) / 1000))]) }}
          >
            <GroupedBarChart data={sectorRows} series={series} format={(v) => tonnes(v, false)} categoryWidth={100} />
          </ChartCard>

          <ChartCard
            title="Reduction potential by intervention" subtitle="t CO₂e per year" legend={legend} photo="/images/seaweed.webp"
            table={{ columns: ["Intervention", ...carbon.map((e) => e.village.name)], rows: interventionRows.map((r) => [r.label as string, ...series.map((s) => num(Number(r[s.key]) / 1000, 1))]) }}
          >
            <GroupedBarChart data={interventionRows} series={series} format={(v) => tonnes(v, false)} categoryWidth={150} />
          </ChartCard>
        </div>
      )}
    </div>
  );
}

function sumRow(row: Record<string, string | number>, series: { key: string }[]) {
  return series.reduce((t, s) => t + Number(row[s.key] ?? 0), 0);
}

function MetricsTable({ entries }: { entries: CompareEntry[] }) {
  const rows: { label: string; value: (e: CompareEntry) => string }[] = [
    { label: "District · block", value: (e) => (e.census ? `${e.census.district ?? "—"} · ${e.census.block ?? "—"}` : "—") },
    { label: "Population", value: (e) => num(e.census?.population ?? e.village.population_2011) },
    { label: "Households", value: (e) => num(e.census?.households) },
    { label: "Area", value: (e) => (e.census?.area_ha != null ? `${num(e.census.area_ha)} ha` : "—") },
    { label: "Forest area", value: (e) => (e.census?.forest_area_ha != null ? `${num(e.census.forest_area_ha, 1)} ha` : "—") },
    { label: "Net emissions today", value: (e) => tonnes(e.village.budget?.net_emission_before) },
    { label: "After interventions", value: (e) => tonnes(e.village.budget?.net_emission_after) },
    { label: "Reduction", value: (e) => pct(e.village.budget?.reduction_pct) },
    { label: "Per person", value: (e) => (e.village.budget?.per_capita_emission_before != null ? `${num(e.village.budget.per_capita_emission_before)} kg` : "—") },
    { label: "Sinks today", value: (e) => tonnes(e.village.budget?.total_sequestration_before) },
    { label: "Planned new sinks", value: (e) => tonnes(e.village.budget?.sequestration_increase) },
    { label: "Largest source", value: (e) => e.village.emissions[0]?.source ?? "—" },
  ];

  return (
    <section className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="tabular w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="p-4 text-left font-medium text-muted">Metric</th>
              {entries.map((e) => (
                <th key={e.village.vlcode} className="p-4 text-right font-semibold text-ink">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: e.color }} />
                    {e.village.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-2.5 text-ink-2">{r.label}</td>
                {entries.map((e) => <td key={e.village.vlcode} className="px-4 py-2.5 text-right text-ink">{r.value(e)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
