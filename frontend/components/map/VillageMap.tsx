"use client";

import { Fragment, useEffect, useMemo } from "react";
import L from "leaflet";
import {
  GeoJSON, LayersControl, MapContainer, Marker, TileLayer, Tooltip, WMSTileLayer, useMap, useMapEvents,
} from "react-leaflet";

import { BASIN_BOUNDS } from "@/constants/theme";
import type { VillageBoundary } from "@/interface/types";
import { GEOSERVER_URL } from "@/services/api";

export interface MapVillage {
  boundary: VillageBoundary;
  name: string;
  color?: string; // compare mode: village slot color
}

interface Props {
  highlighted: MapVillage[];
  assessed: { vlcode: string; name: string; boundary: VillageBoundary }[];
  compare: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onSelect: (vlcode: string) => void;
}

const WMS = `${GEOSERVER_URL}/dashboard/wms`;

const assessedIcon = L.divIcon({
  className: "assessed-marker",
  html: '<span class="ring"></span><span class="dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/** The map mounts before its card has its final size; re-measure and fit the basin once laid out. */
function FitBasinOnMount() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(BASIN_BOUNDS, { padding: [24, 24] });
    }, 150);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function ClickHandler({ onMapClick }: { onMapClick: Props["onMapClick"] }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

/** Zoom to the highlighted villages whenever the selection changes. */
function FitTo({ villages }: { villages: MapVillage[] }) {
  const map = useMap();
  const key = villages.map((v) => v.boundary.id).join(",");
  useEffect(() => {
    if (!villages.length) return;
    const bounds = L.geoJSON(villages.map((v) => v.boundary) as unknown as GeoJSON.Feature[]).getBounds();
    if (bounds.isValid()) map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 15, duration: 0.9 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

export default function VillageMap({ highlighted, assessed, compare, onMapClick, onSelect }: Props) {
  const markers = useMemo(
    () => assessed.map((a) => ({
      ...a,
      center: L.geoJSON(a.boundary as unknown as GeoJSON.Feature).getBounds().getCenter(),
    })),
    [assessed],
  );

  return (
    <MapContainer
      bounds={BASIN_BOUNDS}
      className="h-full w-full"
      zoomControl
      scrollWheelZoom
      preferCanvas={false}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Dark">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Streets">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>

        <LayersControl.Overlay checked name="Village boundaries">
          <WMSTileLayer
            url={WMS}
            params={{ layers: "dashboard:Village_india", format: "image/png", transparent: true, version: "1.1.1" }}
            opacity={0.9}
          />
        </LayersControl.Overlay>
        <LayersControl.Overlay checked name="Varuna basin">
          <WMSTileLayer
            url={WMS}
            params={{ layers: "dashboard:basin_boundary", format: "image/png", transparent: true, version: "1.1.1" }}
          />
        </LayersControl.Overlay>
        <LayersControl.Overlay name="Place names">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />
        </LayersControl.Overlay>
      </LayersControl>

      {highlighted.map((v) =>
        compare ? (
          <GeoJSON
            key={`c-${v.boundary.id}-${v.color}`}
            data={v.boundary as unknown as GeoJSON.Feature}
            style={{ color: v.color, weight: 2.5, fillColor: v.color, fillOpacity: 0.28 }}
          >
            <Tooltip permanent direction="center" className="village-label">{v.name}</Tooltip>
          </GeoJSON>
        ) : (
          <Fragment key={`s-${v.boundary.id}`}>
            {/* soft glow underneath, crisp outline on top */}
            <GeoJSON
              data={v.boundary as unknown as GeoJSON.Feature}
              style={{ color: "#34d399", weight: 10, opacity: 0.25, fill: false }}
              interactive={false}
            />
            <GeoJSON
              data={v.boundary as unknown as GeoJSON.Feature}
              style={{ color: "#a7f3d0", weight: 2.5, fillColor: "#34d399", fillOpacity: 0.2 }}
              interactive={false}
            />
          </Fragment>
        ),
      )}

      {markers.map((m) => (
        <Marker
          key={m.vlcode} position={m.center} icon={assessedIcon}
          eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); onSelect(m.vlcode); } }}
        >
          <Tooltip direction="top" offset={[0, -10]} className="village-label">{m.name} · carbon data</Tooltip>
        </Marker>
      ))}

      <FitBasinOnMount />
      <ClickHandler onMapClick={onMapClick} />
      <FitTo villages={highlighted} />
    </MapContainer>
  );
}
