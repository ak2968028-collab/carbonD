"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { GitCompareArrows, Leaf, Loader2, LogIn, LogOut, Map as MapIcon, Plus, UserPlus, X } from "lucide-react";

import type { AuthMode } from "@/components/auth/AuthForm";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AuthPrompt from "@/components/auth/AuthPrompt";

import CompareView, { type CompareEntry } from "@/components/compare/CompareView";
import Hero from "@/components/dashboard/Hero";
import VillageCarbon from "@/components/dashboard/VillageCarbon";
import VillagePanel from "@/components/dashboard/VillagePanel";
import VillageSearch from "@/components/dashboard/VillageSearch";
import type { MapVillage } from "@/components/map/VillageMap";
import { MAX_COMPARE } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useChartColors } from "@/contexts/ThemeContext";
import type { CarbonSummary, EmissionFactor, VillageBoundary, VillageDetail, VillageSummary } from "@/interface/types";
import { ApiError, api } from "@/services/api";

const VillageMap = dynamic(() => import("@/components/map/VillageMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted">Loading map…</div>,
});

type Mode = "explore" | "compare";

const PROMPT_SEEN_KEY = "vcd_signin_prompt_seen";
const PROMPT_AFTER_MS = 40_000;

interface Loaded {
  detail: VillageDetail;
  boundary: VillageBoundary | null; // null = village has no polygon in GeoServer
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [prompt, setPrompt] = useState<{ open: boolean; mode: AuthMode }>({ open: false, mode: "signin" });

  const [mode, setMode] = useState<Mode>("explore");
  const [summary, setSummary] = useState<CarbonSummary | null>(null);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [assessed, setAssessed] = useState<{ vlcode: string; name: string; boundary: VillageBoundary }[]>([]);
  // All villages with carbon data, including any without a boundary (so no map marker)
  const [carbonCodes, setCarbonCodes] = useState<string[]>([]);

  const cache = useRef(new Map<string, Loaded>());
  const [loaded, setLoaded] = useState<Record<string, Loaded>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  // Each compared village keeps the color slot it was given, so removing one never repaints the others;
  // the slot's color comes from the active theme
  const [compareSlots, setCompare] = useState<{ vlcode: string; slot: number }[]>([]);
  const { villages: slotColors } = useChartColors();
  const compare = useMemo(() => compareSlots.map((c) => ({ ...c, color: slotColors[c.slot] })), [compareSlots, slotColors]);

  // Signing in is optional: ask once per visit, midway (half-way down the page or after 40 s)
  useEffect(() => {
    if (authLoading || user) return;
    const seen = () => {
      try { return sessionStorage.getItem(PROMPT_SEEN_KEY) === "1"; } catch { return false; }
    };
    if (seen()) return;
    const show = () => {
      if (seen()) return;
      try { sessionStorage.setItem(PROMPT_SEEN_KEY, "1"); } catch {}
      setPrompt({ open: true, mode: "signin" });
      cleanup();
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= 0.5) show();
    };
    const timer = setTimeout(show, PROMPT_AFTER_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
    return cleanup;
  }, [authLoading, user]);

  const openAuth = (mode: AuthMode) => setPrompt({ open: true, mode });
  const closeAuth = useCallback(() => setPrompt((p) => ({ ...p, open: false })), []);

  const load = useCallback(async (vlcode: string): Promise<Loaded> => {
    const hit = cache.current.get(vlcode);
    if (hit) return hit;
    const [detail, boundary] = await Promise.all([
      api.village(vlcode),
      api.boundary(vlcode).catch((e) => {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }),
    ]);
    const entry = { detail, boundary };
    cache.current.set(vlcode, entry);
    setLoaded((l) => ({ ...l, [vlcode]: entry }));
    return entry;
  }, []);

  // Study-area numbers + markers for the villages that have carbon data (public, no sign-in needed)
  useEffect(() => {
    api.summary().then(setSummary).catch(() => {});
    api.emissionFactors().then(setFactors).catch(() => {});
    api.villages({ has_carbon: true, limit: 50 }).then(async (page) => {
      setCarbonCodes(page.items.map((v) => v.vlcode));
      const withBoundary = await Promise.all(
        page.items.map((v) => api.boundary(v.vlcode).then((b) => ({ vlcode: v.vlcode, name: v.name, boundary: b })).catch(() => null)),
      );
      setAssessed(withBoundary.filter((x): x is NonNullable<typeof x> => x !== null));
    }).catch(() => {});
  }, []);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const select = useCallback(async (vlcode: string) => {
    setBusy(true);
    try {
      await load(vlcode);
      setSelected(vlcode);
    } catch (e) {
      flash(e instanceof Error ? e.message : "Could not load village");
    } finally {
      setBusy(false);
    }
  }, [load]);

  const addToCompare = useCallback(async (vlcode: string) => {
    if (compare.some((c) => c.vlcode === vlcode)) return;
    if (compare.length >= MAX_COMPARE) {
      flash(`Compare up to ${MAX_COMPARE} villages at a time`);
      return;
    }
    setBusy(true);
    try {
      await load(vlcode);
      setCompare((c) => {
        if (c.some((x) => x.vlcode === vlcode) || c.length >= MAX_COMPARE) return c;
        const free = [0, 1, 2, 3].find((slot) => !c.some((x) => x.slot === slot))!;
        return [...c, { vlcode, slot: free }];
      });
    } catch (e) {
      flash(e instanceof Error ? e.message : "Could not load village");
    } finally {
      setBusy(false);
    }
  }, [compare, load]);

  const pick = useCallback((vlcode: string) => (mode === "explore" ? select(vlcode) : addToCompare(vlcode)), [mode, select, addToCompare]);

  const onMapClick = useCallback(async (lat: number, lng: number) => {
    setBusy(true);
    try {
      const v = await api.villageAt(lng, lat);
      await pick(v.vlcode);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) flash("No village boundary at that spot");
      else flash(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setBusy(false);
    }
  }, [pick]);

  const switchMode = (m: Mode) => {
    setMode(m);
    // Carry the explored village into compare mode as the first entry
    if (m === "compare" && selected && !compare.length) addToCompare(selected);
  };

  const compareAllAssessed = async () => {
    const codes = carbonCodes.slice(0, MAX_COMPARE);
    setBusy(true);
    try {
      await Promise.all(codes.map(load));
      setCompare(codes.map((vlcode, slot) => ({ vlcode, slot })));
    } finally {
      setBusy(false);
    }
  };

  const current = selected ? loaded[selected] : null;

  const highlighted: MapVillage[] = useMemo(() => {
    if (mode === "explore") {
      return current?.boundary ? [{ boundary: current.boundary, name: current.detail.name }] : [];
    }
    return compare.flatMap((c) => {
      const l = loaded[c.vlcode];
      return l?.boundary ? [{ boundary: l.boundary, name: l.detail.name, color: c.color }] : [];
    });
  }, [mode, current, compare, loaded]);

  const compareEntries: CompareEntry[] = compare.flatMap((c) => {
    const l = loaded[c.vlcode];
    return l ? [{ village: l.detail, census: l.boundary?.properties ?? null, color: c.color }] : [];
  });

  return (
    <div className="min-h-screen">
      <TopBar
        mode={mode} onMode={switchMode} authLoading={authLoading}
        user={user ? user.full_name ?? user.username : null} onLogout={logout} onAuth={openAuth}
      />
      <AuthPrompt open={prompt.open} mode={prompt.mode} onClose={closeAuth} />

      <main className="mx-auto max-w-[1480px] space-y-6 px-4 pb-16 pt-6 sm:px-6">
        {mode === "explore" && <Hero summary={summary} />}

        {mode === "compare" && (
          <section className="card p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">Compare villages</h2>
                <p className="text-sm text-muted">Add up to {MAX_COMPARE} villages: search, or click them on the map.</p>
              </div>
              <button
                onClick={compareAllAssessed}
                className="ml-auto flex items-center gap-1.5 rounded-xl border border-accent-line bg-accent-soft px-3 py-2 text-sm font-medium text-accent hover:brightness-110"
              >
                <Leaf className="h-4 w-4" /> Compare all assessed villages
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {compare.map((c) => (
                <span key={c.vlcode} className="flex items-center gap-2 rounded-full border border-line bg-surface-2 py-1 pl-3 pr-1 text-sm text-ink">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  {loaded[c.vlcode]?.detail.name ?? c.vlcode}
                  <button
                    onClick={() => setCompare((cs) => cs.filter((x) => x.vlcode !== c.vlcode))}
                    className="rounded-full p-1 text-muted hover:bg-hover hover:text-ink" aria-label="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              {compare.length < MAX_COMPARE && (
                <span className="flex items-center gap-1 text-sm text-muted">
                  <Plus className="h-4 w-4" /> {MAX_COMPARE - compare.length} more
                </span>
              )}
            </div>
          </section>
        )}

        <div className={`grid gap-6 ${mode === "explore" ? "lg:grid-cols-[minmax(0,1fr)_420px]" : ""}`}>
          <section className="card relative h-[560px] overflow-hidden p-0 lg:h-[620px]">
            <div className="absolute left-14 right-14 top-3 z-[500] max-w-md">
              <VillageSearch
                onPick={(v: VillageSummary) => pick(v.vlcode)}
                exclude={mode === "compare" ? compare.map((c) => c.vlcode) : []}
                placeholder={mode === "compare" ? "Add a village to compare…" : undefined}
              />
            </div>
            {(busy || notice) && (
              <div className="glass theme-dark absolute bottom-4 left-1/2 z-[500] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-sm text-ink">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {notice ?? "Loading village…"}
              </div>
            )}
            <VillageMap
              highlighted={highlighted}
              assessed={assessed}
              compare={mode === "compare"}
              onMapClick={onMapClick}
              onSelect={pick}
            />
          </section>

          {mode === "explore" && (
            <VillagePanel
              village={current?.detail ?? null}
              census={current?.boundary?.properties ?? null}
              boundaryMissing={!!current && !current.boundary}
              loading={busy}
              onClear={() => setSelected(null)}
            />
          )}
        </div>

        {mode === "explore" && current && <VillageCarbon village={current.detail} factors={factors} />}

        {mode === "compare" && (compareEntries.length >= 2 ? (
          <CompareView entries={compareEntries} />
        ) : (
          <p className="card p-6 text-sm text-ink-2">
            Pick at least two villages to compare them side by side.
          </p>
        ))}
      </main>
    </div>
  );
}

function TopBar({ mode, onMode, user, authLoading, onLogout, onAuth }: {
  mode: Mode;
  onMode: (m: Mode) => void;
  user: string | null;
  authLoading: boolean;
  onLogout: () => void;
  onAuth: (mode: AuthMode) => void;
}) {
  return (
    <header className="sticky top-0 z-[1100] border-b border-line bg-topbar backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1480px] items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-lime-500 shadow-lg shadow-emerald-500/20">
            <Leaf className="h-5 w-5 text-emerald-950" />
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-ink">Village Carbon Dashboard</p>
            <p className="text-[11px] text-muted">Varuna basin</p>
          </div>
        </div>

        <nav className="mx-auto flex rounded-xl border border-line bg-surface-2 p-1 text-sm">
          {([["explore", "Explore", MapIcon], ["compare", "Compare", GitCompareArrows]] as const).map(([m, label, Icon]) => (
            <button
              key={m} onClick={() => onMode(m)} aria-pressed={mode === m}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${mode === m ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>

        <div className="flex min-w-[88px] items-center justify-end gap-2">
          <ThemeToggle />
          {authLoading ? null : user ? (
            <>
              <span className="hidden text-sm text-ink-2 md:inline">{user}</span>
              <button onClick={onLogout} className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-sm text-ink-2 hover:bg-hover hover:text-ink">
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onAuth("signin")} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-ink-2 hover:bg-hover hover:text-ink">
                <LogIn className="h-4 w-4" /> <span className="hidden sm:inline">Sign in</span>
              </button>
              <button onClick={() => onAuth("signup")} className="flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-1.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-300">
                <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Sign up</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
