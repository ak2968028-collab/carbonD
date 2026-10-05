"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const GEOSERVER_URL = process.env.NEXT_PUBLIC_GEOSERVER_URL;

export default function Home() {
  const [health, setHealth] = useState<string>("checking...");

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((r) => r.json())
      .then((d) => setHealth(JSON.stringify(d, null, 2)))
      .catch((e) => setHealth(`Backend unreachable: ${e}`));
  }, []);

  return (
    <main>
      <h1>DashBoard</h1>
      <p>Backend: <a href={`${API_URL}/docs`}>{API_URL}</a></p>
      <p>GeoServer: <a href={GEOSERVER_URL}>{GEOSERVER_URL}</a></p>
      <h2>Service health</h2>
      <pre>{health}</pre>
    </main>
  );
}
