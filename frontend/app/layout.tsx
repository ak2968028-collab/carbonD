import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Village Carbon Dashboard",
  description: "Village-level emissions, sequestration and low-carbon pathways in the Varuna basin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
