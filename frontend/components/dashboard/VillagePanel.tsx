import Image from "next/image";
import { Home, Leaf, MapPin, Trees, Users, Wheat, X } from "lucide-react";

import StatTile from "@/components/ui/StatTile";
import { useChartColors } from "@/contexts/ThemeContext";
import type { CensusProperties, VillageDetail } from "@/interface/types";
import { num, pct, titleCase, tonnes } from "@/lib/format";

interface Props {
  village: VillageDetail | null;
  census: CensusProperties | null;
  boundaryMissing: boolean;
  loading: boolean;
  onClear: () => void;
}

/** Right-hand panel: who/where the village is, and its carbon balance if assessed. */
export default function VillagePanel({ village, census, boundaryMissing, loading, onClear }: Props) {
  if (!village) {
    return (
      <aside className="card theme-dark relative flex h-full min-h-[420px] flex-col justify-end overflow-hidden">
        <Image src="/images/sapling.webp" alt="" fill className="object-cover opacity-60" sizes="(min-width:1024px) 33vw, 100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07130d] via-[#07130d]/70 to-transparent" />
        <div className="relative p-6">
          <p className="text-lg font-semibold text-white">Pick a village</p>
          <p className="mt-1 text-sm text-white/70">
            Click inside any boundary on the map, use the search, or tap a pulsing marker to open a village with a
            full carbon assessment.
          </p>
        </div>
      </aside>
    );
  }

  const b = village.budget;
  const population = census?.population ?? village.population_2011;
  return (
    <aside className="card flex h-full flex-col overflow-hidden">
      <header className="flex items-start gap-3 border-b border-line p-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft ring-1 ring-accent-line">
          <MapPin className="h-5 w-5 text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold text-ink">{village.name}</h2>
          <p className="text-sm text-muted">
            {census
              ? `${titleCase(census.block)} block · ${titleCase(census.district)} · vlcode ${village.vlcode}`
              : `vlcode ${village.vlcode}`}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {village.has_carbon_data ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                <Leaf className="h-3 w-3" /> Carbon assessed
              </span>
            ) : (
              <span className="rounded-full bg-hover px-2 py-0.5 text-[11px] text-ink-2">No carbon assessment yet</span>
            )}
            {boundaryMissing && (
              <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[11px] text-warn-text">No boundary in GeoServer</span>
            )}
          </div>
        </div>
        <button onClick={onClear} className="rounded-lg p-1.5 text-muted hover:bg-hover hover:text-ink" aria-label="Clear selection">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className={`flex-1 space-y-5 overflow-auto p-5 ${loading ? "opacity-60" : ""}`}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Fact icon={<Users className="h-4 w-4" />} label="Population" value={num(population)} />
          <Fact icon={<Home className="h-4 w-4" />} label="Households" value={num(census?.households)} />
          <Fact icon={<MapPin className="h-4 w-4" />} label="Area" value={census?.area_ha != null ? `${num(census.area_ha)} ha` : "—"} />
        </div>

        {census && <LandUse census={census} />}

        {b && (
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Net emissions today" value={tonnes(b.net_emission_before)} sub="CO₂e per year" />
            <StatTile
              label="After interventions" value={tonnes(b.net_emission_after)} sub="CO₂e per year"
              delta={b.reduction_pct != null ? { value: pct(b.reduction_pct), down: true, note: " vs today" } : undefined}
            />
            <StatTile label="Per person" value={b.per_capita_emission_before != null ? `${num(b.per_capita_emission_before)} kg` : "—"} sub="CO₂e per year" />
            <StatTile
              label="Carbon sinks, planned" value={tonnes((b.total_sequestration_before ?? 0) + (b.sequestration_increase ?? 0))}
              sub={`CO₂ absorbed per year, from ${tonnes(b.total_sequestration_before)} today`}
            />
          </div>
        )}
      </div>
    </aside>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-2 py-3">
      <div className="mx-auto mb-1 flex w-fit text-muted">{icon}</div>
      <p className="text-base font-semibold text-ink">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

/** Land-use split as one stacked bar (sequential greens, 2px surface gaps) + labelled legend. */
function LandUse({ census }: { census: CensusProperties }) {
  const { landUse } = useChartColors();
  const parts = [
    { label: "Net sown", value: census.net_sown_area_ha, color: landUse.sown, icon: <Wheat className="h-3 w-3" /> },
    { label: "Forest", value: census.forest_area_ha, color: landUse.forest, icon: <Trees className="h-3 w-3" /> },
    { label: "Fallow", value: census.current_fallow_ha, color: landUse.fallow },
    { label: "Barren", value: census.barren_area_ha, color: landUse.barren },
  ].filter((p) => (p.value ?? 0) > 0) as { label: string; value: number; color: string; icon?: React.ReactNode }[];
  const total = census.area_ha ?? parts.reduce((s, p) => s + p.value, 0);
  if (!parts.length || !total) return null;
  const irrigatedShare = census.net_sown_area_ha ? (census.irrigated_area_ha ?? 0) / census.net_sown_area_ha : null;

  return (
    <div>
      <p className="mb-2 text-[13px] text-muted">Land use (census)</p>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-hover">
        {parts.map((p) => (
          <div key={p.label} title={`${p.label}: ${num(p.value)} ha`} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5 text-ink-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
            {p.label}
            <span className="tabular ml-auto text-ink">{num(p.value)} ha</span>
          </li>
        ))}
      </ul>
      {irrigatedShare != null && (
        <p className="mt-2 text-xs text-muted">{pct(Math.min(irrigatedShare, 1) * 100, 0)} of sown area irrigated</p>
      )}
    </div>
  );
}
