import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider, themeInitScript } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Village Carbon Dashboard",
  description: "Village-level emissions, sequestration and low-carbon pathways in the Varuna basin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme is set before paint by the init script, so React must not complain about it
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
