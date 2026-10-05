import Image from "next/image";
import { Factory, Leaf, MapPinned, Sprout, Users } from "lucide-react";

import type { CarbonSummary } from "@/interface/types";
import { compact, num, pct, tonnes } from "@/lib/format";

/** Photo banner with the one hero figure for the study area and its supporting tiles. */
export default function Hero({ summary }: { summary: CarbonSummary | null }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10">
      <Image src="/images/hero-tree.webp" alt="" fill priority className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#04110a] via-[#04110a]/85 to-[#04110a]/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#04110a] via-transparent to-transparent" />

      <div className="relative z-10 grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:p-10">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-emerald-200 backdrop-blur">
            <Leaf className="h-3.5 w-3.5" /> Varuna basin · village carbon accounting
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            From village emissions <span className="text-emerald-300">to village sinks</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
            Click any village on the map, or search for one, to see its boundary, census profile and carbon balance.
          </p>

          <div className="mt-7">
            <p className="text-sm text-white/65">Net emission cut from planned interventions</p>
            <p className="mt-1 text-6xl font-semibold tracking-tight text-white">
              {summary?.reduction_pct != null ? `−${pct(summary.reduction_pct)}` : "—"}
            </p>
            <p className="mt-2 text-sm text-white/60">
              {summary
                ? `${tonnes(summary.net_emission_before_kg)} → ${tonnes(summary.net_emission_after_kg)} CO₂e/yr across ${summary.villages_assessed} assessed villages`
                : "Loading…"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 self-end">
          <HeroTile icon={<MapPinned className="h-4 w-4" />} label="Villages mapped" value={summary ? num(summary.villages_total) : "—"} />
          <HeroTile icon={<Users className="h-4 w-4" />} label="Population (2011)" value={summary ? compact(summary.population_total) : "—"} />
          <HeroTile icon={<Factory className="h-4 w-4" />} label="Gross emissions" value={summary ? tonnes(summary.total_emission_kg) : "—"} sub="CO₂e per year" />
          <HeroTile icon={<Sprout className="h-4 w-4" />} label="Existing sequestration" value={summary ? tonnes(summary.total_sequestration_kg) : "—"} sub={summary ? `+${tonnes(summary.sequestration_increase_kg)} planned` : undefined} />
        </div>
      </div>
    </section>
  );
}

function HeroTile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="flex items-center gap-2 text-xs text-white/65">{icon}{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-white/55">{sub}</p>}
    </div>
  );
}
