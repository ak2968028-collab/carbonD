"use client";

import { useEffect, useRef, useState } from "react";
import { Leaf, Loader2, Search } from "lucide-react";

import type { VillageSummary } from "@/interface/types";
import { compact } from "@/lib/format";
import { api } from "@/services/api";

/** Search all villages by name or vlcode. Villages with carbon data are listed first. */
export default function VillageSearch({ onPick, placeholder = "Search 3,500+ villages by name or code", exclude = [] }: {
  onPick: (v: VillageSummary) => void;
  placeholder?: string;
  exclude?: string[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VillageSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    const handle = setTimeout(() => {
      setLoading(true);
      api.villages({ search: q || undefined, has_carbon: q ? undefined : true, limit: 12 })
        .then((page) => {
          setResults(page.items);
          setTotal(page.total);
          setActive(0);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const visible = results.filter((r) => !exclude.includes(r.vlcode));

  function pick(v: VillageSummary) {
    onPick(v);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="flex h-11 items-center gap-2 rounded-xl border border-input-line bg-popover px-3 backdrop-blur focus-within:border-accent">
        <Search className="h-4 w-4 text-muted" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, visible.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter" && visible[active]) pick(visible[active]);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          role="combobox" aria-expanded={open} aria-controls="village-results"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
      </div>

      {open && (
        <div id="village-results" role="listbox" className="absolute z-[1000] mt-2 w-full overflow-hidden rounded-xl border border-line bg-popover shadow-2xl backdrop-blur">
          <p className="border-b border-line px-3 py-2 text-[11px] uppercase tracking-wide text-muted">
            {query.trim() ? `${total} match${total === 1 ? "" : "es"}` : "Villages with carbon assessment"}
          </p>
          <ul className="max-h-80 overflow-auto py-1">
            {visible.map((v, i) => (
              <li key={v.vlcode}>
                <button
                  role="option" aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(v)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${i === active ? "bg-hover" : ""}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-ink">{v.name}</span>
                    <span className="text-xs text-muted">
                      {v.vlcode}{v.population_2011 != null && ` · pop. ${compact(v.population_2011)}`}
                    </span>
                  </span>
                  {v.has_carbon_data && (
                    <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                      <Leaf className="h-3 w-3" /> carbon data
                    </span>
                  )}
                </button>
              </li>
            ))}
            {!visible.length && !loading && <li className="px-3 py-4 text-sm text-muted">No villages found</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
