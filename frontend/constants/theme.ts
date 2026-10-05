// Chart colors per theme, validated with the dataviz palette checker:
//   dark  against the dark card surface  (#0f1c15)
//   light against the light card surface (#ffffff)
// Village slots pass all-pairs for 3 series and adjacent-pairs for 4 in both themes; the map and
// charts also label every village directly, so color never carries identity alone. In light mode
// slots 3-4 are below 3:1 contrast, which is why every chart has value labels and a table view.

export type ThemeName = "light" | "dark";

export interface ChartPalette {
  villages: readonly [string, string, string, string];
  scenario: Record<string, string>;
  emission: string;
  reduction: string;
  existing: string;
  neutral: string; // waterfall totals
  grid: string;
  axis: string;
  ink: string;
  ink2: string;
  muted: string;
  surface: string;
  cursor: string;
  landUse: { sown: string; forest: string; fallow: string; barren: string };
}

export const PALETTES: Record<ThemeName, ChartPalette> = {
  dark: {
    villages: ["#3987e5", "#d95926", "#199e70", "#c98500"],
    scenario: { BAU: "#d95926", LOS: "#3987e5", ACC: "#199e70" },
    emission: "#d95926",
    reduction: "#199e70",
    existing: "#3987e5",
    neutral: "#8fa89a",
    grid: "#1f3328",
    axis: "#2d4637",
    ink: "#eef5f0",
    ink2: "#b3c4b9",
    muted: "#7d9185",
    surface: "#0f1c15",
    cursor: "rgba(255,255,255,0.04)",
    landUse: { sown: "#4d9b3a", forest: "#1f6b3f", fallow: "#9bb86a", barren: "#8a8170" },
  },
  light: {
    villages: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"],
    scenario: { BAU: "#eb6834", LOS: "#2a78d6", ACC: "#1baf7a" },
    emission: "#eb6834",
    reduction: "#1baf7a",
    existing: "#2a78d6",
    neutral: "#7f988a",
    grid: "#e3ebe4",
    axis: "#c5d3c8",
    ink: "#0f1f16",
    ink2: "#3f5547",
    muted: "#66796c",
    surface: "#ffffff",
    cursor: "rgba(15,40,25,0.05)",
    landUse: { sown: "#5aa845", forest: "#1f6b3f", fallow: "#b5cf86", barren: "#a39a88" },
  },
};

export const SCENARIOS: Record<string, { label: string; long: string }> = {
  BAU: { label: "BAU", long: "Business as usual" },
  LOS: { label: "LOS", long: "Low-carbon scenario" },
  ACC: { label: "ACC", long: "Accelerated action" },
};

export const MAX_COMPARE = 4;

// Initial map view: the Varuna basin
export const BASIN_BOUNDS: [[number, number], [number, number]] = [
  [25.24, 81.72],
  [25.8, 83.07],
];
