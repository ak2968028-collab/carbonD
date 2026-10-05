// Chart colors, validated with the dataviz palette checker against the card surface (#0f1c15, dark).
// Village slots pass all-pairs for 3 series and adjacent-pairs for 4; the map and charts also
// label every village directly, so color never carries identity alone.
export const VILLAGE_COLORS = ["#3987e5", "#d95926", "#199e70", "#c98500"] as const;

export const SCENARIOS: Record<string, { label: string; long: string; color: string }> = {
  BAU: { label: "BAU", long: "Business as usual", color: "#d95926" },
  LOS: { label: "LOS", long: "Low-carbon scenario", color: "#3987e5" },
  ACC: { label: "ACC", long: "Accelerated action", color: "#199e70" },
};

export const COLOR = {
  emission: "#d95926",
  reduction: "#199e70",
  existing: "#3987e5",
  grid: "#1f3328",
  axis: "#2d4637",
  ink: "#eef5f0",
  ink2: "#b3c4b9",
  muted: "#7d9185",
  surface: "#0f1c15",
  good: "#0ca30c",
  critical: "#d03b3b",
};

export const MAX_COMPARE = 4;

// Initial map view: the Varuna basin
export const BASIN_BOUNDS: [[number, number], [number, number]] = [
  [25.24, 81.72],
  [25.8, 83.07],
];
