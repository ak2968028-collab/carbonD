"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { PALETTES, type ChartPalette, type ThemeName } from "@/constants/theme";

export const THEME_KEY = "vcd_theme";

/** Runs in <head> before paint so the stored/OS theme applies without a flash. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

interface ThemeState {
  theme: ThemeName;
  toggle: () => void;
  colors: ChartPalette;
}

const ThemeContext = createContext<ThemeState | null>(null);

function resolvedTheme(): ThemeName {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start dark on the server; the effect below corrects it on the first client render
  const [theme, setTheme] = useState<ThemeName>("dark");

  useEffect(() => {
    setTheme(resolvedTheme());
    // Follow OS changes until the user picks a theme explicitly
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setTheme(resolvedTheme());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: ThemeName = resolvedTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
    setTheme(next);
  }, []);

  const value = useMemo(() => ({ theme, toggle, colors: PALETTES[theme] }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

/** Chart colors for the active theme. */
export const useChartColors = () => useTheme().colors;
