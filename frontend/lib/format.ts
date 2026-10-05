const nf0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

/** Source data is kg CO2e; the UI reports tonnes. */
export const toTonnes = (kg: number | null | undefined) => (kg == null ? null : kg / 1000);

/** Auto-compact tonnes: 284 t / 12.9k t / 1.2M t */
export function tonnes(kg: number | null | undefined, withUnit = true): string {
  const t = toTonnes(kg);
  if (t == null) return "—";
  const unit = withUnit ? " t" : "";
  const abs = Math.abs(t);
  if (abs >= 1_000_000) return `${nf1.format(t / 1_000_000)}M${unit}`;
  if (abs >= 1_000) return `${nf1.format(t / 1_000)}k${unit}`;
  return `${nf0.format(t)}${unit}`;
}

export function num(value: number | null | undefined, digits = 0): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(value);
}

export function compact(value: number | null | undefined): string {
  if (value == null) return "—";
  // en-US compact (K/M) so it reads the same as the tonne figures
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function pct(value: number | null | undefined, digits = 1): string {
  return value == null ? "—" : `${value.toFixed(digits)}%`;
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return "—";
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
