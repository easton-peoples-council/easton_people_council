import { neon } from "@neondatabase/serverless";

export type BoundarySubmission = {
  geometry: { type: "Polygon"; coordinates: [number, number][][] };
  pointCount: number;
};

/**
 * Neon over HTTP — no pool, no connection to keep alive, so the client is built
 * per call rather than at module scope. Reading DATABASE_URL on import would
 * also make `next build` fail anywhere the database isn't configured, which is
 * every environment that only wants the static pages.
 *
 * Unlike the other integrations here this one cannot fail soft: a drawn
 * boundary exists nowhere but this request, so a missing URL has to throw
 * rather than skip the write.
 */
function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — a boundary submission was received but could not be stored"
    );
  }
  return neon(url);
}

export type BoundaryFeature = {
  id: number;
  pointCount: number;
  submitted: string;
  geometry: { type: "Polygon"; coordinates: [number, number][][] };
};

/**
 * Submitted boundaries, newest first, for public display.
 *
 * Safe to expose: the table holds no personal data at all. Names and emails go
 * to Qomon only. Columns are still listed explicitly so that adding a
 * sensitive one later cannot silently widen this endpoint.
 */
export async function listBoundaries(limit = 500): Promise<BoundaryFeature[]> {
  const sql = connect();
  const rows = await sql`
    select id, point_count, created_at, geometry
    from boundary_submissions
    order by created_at desc
    limit ${limit}
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    pointCount: Number(row.point_count),
    submitted: new Date(row.created_at).toISOString(),
    geometry: row.geometry,
  }));
}

export async function insertBoundary({
  geometry,
  pointCount,
}: BoundarySubmission): Promise<void> {
  const sql = connect();
  await sql`
    insert into boundary_submissions (geometry, point_count)
    values (${JSON.stringify(geometry)}::jsonb, ${pointCount})
  `;
}
