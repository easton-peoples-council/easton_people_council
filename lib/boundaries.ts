/**
 * Geometry helpers for the submitted-boundary views. Framework-free and pure —
 * no Leaflet, no React, no I/O.
 */

export type Ring = [number, number][];

export type CoverageCell = {
  south: number;
  west: number;
  north: number;
  east: number;
  /** How many submitted boundaries contain this cell's centre. */
  count: number;
};

export type Coverage = {
  cells: CoverageCell[];
  /** Highest count on the grid, i.e. the size of the strongest agreement. */
  maxCount: number;
};

/**
 * Ray casting. `true` when the point is inside the ring.
 *
 * Boundary cases are not special-cased: a cell centre landing exactly on an
 * edge may fall either way, which is immaterial at grid resolution.
 */
export function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const straddles = yi > lat !== yj > lat;
    if (straddles && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Approximate area of a ring in km², via the shoelace formula with a cosine
 * correction for longitude converging at this latitude. Good enough to tell a
 * street from a neighbourhood; not a survey instrument.
 */
export function ringAreaKm2(ring: Ring): number {
  if (ring.length < 3) return 0;
  let doubleArea = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    doubleArea += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  const meanLat = ring.reduce((sum, p) => sum + p[1], 0) / ring.length;
  const kmPerDegree = 111.32;
  return (
    Math.abs(doubleArea / 2) *
    kmPerDegree *
    kmPerDegree *
    Math.cos((meanLat * Math.PI) / 180)
  );
}

/**
 * Count how many of `rings` cover each cell of a grid over their combined
 * extent — the heatmap's underlying data.
 *
 * `resolution` is the number of cells across the wider axis. Cells are kept
 * roughly square on the ground by dividing the longitude step by cos(latitude),
 * so they don't come out as letterboxes at Bristol's latitude.
 *
 * Cells no boundary covers are omitted, so the result is sparse.
 */
export function buildCoverage(rings: Ring[], resolution = 44): Coverage {
  const usable = rings.filter((ring) => ring.length >= 3);
  if (usable.length === 0) return { cells: [], maxCount: 0 };

  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const ring of usable) {
    for (const [lng, lat] of ring) {
      if (lng < west) west = lng;
      if (lng > east) east = lng;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
    }
  }

  const meanLat = (south + north) / 2;
  const lngScale = Math.max(Math.cos((meanLat * Math.PI) / 180), 0.1);
  // Compare spans in comparable units before deciding which axis is wider.
  const widthKm = (east - west) * lngScale;
  const heightKm = north - south;
  const step = Math.max(widthKm, heightKm) / resolution;
  if (!Number.isFinite(step) || step <= 0) return { cells: [], maxCount: 0 };

  const latStep = step;
  const lngStep = step / lngScale;

  const cells: CoverageCell[] = [];
  let maxCount = 0;

  for (let lat = south; lat < north + latStep; lat += latStep) {
    for (let lng = west; lng < east + lngStep; lng += lngStep) {
      const centreLat = lat + latStep / 2;
      const centreLng = lng + lngStep / 2;
      let count = 0;
      for (const ring of usable) {
        if (pointInRing(centreLng, centreLat, ring)) count += 1;
      }
      if (count === 0) continue;
      if (count > maxCount) maxCount = count;
      cells.push({
        south: lat,
        west: lng,
        north: lat + latStep,
        east: lng + lngStep,
        count,
      });
    }
  }

  return { cells, maxCount };
}
