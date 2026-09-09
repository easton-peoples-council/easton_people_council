"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildCoverage, ringAreaKm2, type Ring } from "@/lib/boundaries";

const EASTON_CENTRE: [number, number] = [51.4653, -2.562];

/** What /api/boundary/geojson returns per submission. */
type BoundaryProperties = { id: number; point_count: number; submitted: string };
type BoundaryFeature = GeoJSON.Feature<GeoJSON.Polygon, BoundaryProperties>;

/** Pale where one person agreed, deep where many did. */
function heatColour(count: number, maxCount: number): string {
  const from = [220, 234, 245]; // pale blue
  const to = [21, 58, 104]; // deep blue
  const t = maxCount <= 1 ? 1 : (count - 1) / (maxCount - 1);
  const channel = (i: number) => Math.round(from[i] + (to[i] - from[i]) * t);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BoundarySubmissions() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | undefined>(undefined);
  const highlightRef = useRef<import("leaflet").GeoJSON | undefined>(undefined);
  const leafletRef = useRef<typeof import("leaflet") | undefined>(undefined);

  const [features, setFeatures] = useState<BoundaryFeature[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/boundary/geojson");
        const data = res.ok ? await res.json() : null;
        if (cancelled) return;
        if (!data || !Array.isArray(data.features)) {
          setFailed(true);
          return;
        }
        setFeatures(data.features);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rings: Ring[] = useMemo(
    () => (features ?? []).map((f) => f.geometry.coordinates[0] as Ring),
    [features]
  );

  // Grid counting is O(cells × submissions), so keep it off every render.
  const coverage = useMemo(() => buildCoverage(rings), [rings]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || coverage.cells.length === 0) return;

    let cancelled = false;

    // Leaflet touches `window` on import, so it loads here rather than at
    // module scope. Geoman is absent — this map is read-only.
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      leafletRef.current = L;

      // preferCanvas: one canvas beats a thousand SVG nodes for a grid.
      const map = L.map(container, { scrollWheelZoom: false, preferCanvas: true }).setView(
        EASTON_CENTRE,
        14
      );
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      for (const cell of coverage.cells) {
        L.rectangle(
          [
            [cell.south, cell.west],
            [cell.north, cell.east],
          ],
          {
            stroke: false,
            fillColor: heatColour(cell.count, coverage.maxCount),
            fillOpacity: 0.2 + 0.55 * (cell.count / Math.max(coverage.maxCount, 1)),
          }
        ).addTo(map);
      }

      const bounds = L.latLngBounds(
        coverage.cells.flatMap((c) => [
          [c.south, c.west] as [number, number],
          [c.north, c.east] as [number, number],
        ])
      );
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = undefined;
      highlightRef.current = undefined;
    };
  }, [coverage]);

  // Outline whichever submission is selected in the list below.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (highlightRef.current) {
      highlightRef.current.remove();
      highlightRef.current = undefined;
    }
    if (selected === null) return;

    const feature = (features ?? []).find((f) => f.properties.id === selected);
    if (!feature) return;

    highlightRef.current = L.geoJSON(feature, {
      // Accent orange: the heatmap is blue, so navy no longer reads as separate.
      style: { color: "#D65C2E", weight: 3, opacity: 1, fill: false },
    }).addTo(map);

    const bounds = highlightRef.current.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [32, 32] });
  }, [selected, features]);

  if (failed) {
    return (
      <p className="boundaryHint">
        Submitted boundaries can’t be loaded at the moment.
      </p>
    );
  }

  if (features === null) {
    return <p className="boundaryHint">Loading submitted boundaries…</p>;
  }

  if (features.length === 0) {
    return (
      <p className="boundaryHint">
        No boundaries have been submitted yet — yours would be the first.
      </p>
    );
  }

  return (
    <>
      <p className="boundaryHint">
        {features.length === 1
          ? "One boundary submitted so far."
          : `${features.length} boundaries submitted so far.`}{" "}
        Deeper shading marks the areas more people included.
      </p>

      <div ref={containerRef} className="boundaryMap boundaryHeatmap" />

      <h3>Recent submissions</h3>
      <ol className="submissionList">
        {features.map((feature) => {
          const ring = feature.geometry.coordinates[0] as Ring;
          const isSelected = selected === feature.properties.id;
          return (
            <li key={feature.properties.id}>
              <button
                type="button"
                className={isSelected ? "submissionRow selected" : "submissionRow"}
                aria-pressed={isSelected}
                onClick={() =>
                  setSelected(isSelected ? null : feature.properties.id)
                }
              >
                <span className="submissionDate">
                  {formatDate(feature.properties.submitted)}
                </span>
                <span className="submissionMeta">
                  {ringAreaKm2(ring).toFixed(2)} km²
                </span>
                <span className="submissionAction">
                  {isSelected ? "Hide outline" : "Show on map"}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}
