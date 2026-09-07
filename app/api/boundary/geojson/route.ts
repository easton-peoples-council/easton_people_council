import { NextResponse } from "next/server";
import { listBoundaries } from "@/lib/db";

// Reading is cheap and the data changes only when someone submits, so let a
// response be reused for a minute rather than hitting Neon on every page view.
export const revalidate = 60;

/**
 * GET /api/boundary/geojson
 *
 * Every submitted boundary as a GeoJSON FeatureCollection — the format
 * geojson.io, QGIS and Leaflet all read directly.
 *
 * Geometry only. Nothing here identifies a submitter; see listBoundaries().
 */
export async function GET() {
  try {
    const boundaries = await listBoundaries();

    return NextResponse.json({
      type: "FeatureCollection",
      features: boundaries.map((boundary) => ({
        type: "Feature",
        id: boundary.id,
        properties: {
          id: boundary.id,
          point_count: boundary.pointCount,
          submitted: boundary.submitted,
        },
        geometry: boundary.geometry,
      })),
    });
  } catch (error) {
    // Fails soft, unlike the POST: a reader losing the overlay is a cosmetic
    // problem, and /map must stay usable for drawing regardless.
    console.error("[boundary/geojson]", error);
    return NextResponse.json(
      { type: "FeatureCollection", features: [] },
      { status: 503 }
    );
  }
}
