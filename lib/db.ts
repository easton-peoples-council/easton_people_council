import { neon } from "@neondatabase/serverless";

export type BoundarySubmission = {
  name: string;
  email: string;
  geometry: { type: "Polygon"; coordinates: [number, number][][] };
  pointCount: number;
};

export async function insertBoundary({
  name,
  email,
  geometry,
  pointCount,
}: BoundarySubmission): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    insert into boundary_submissions (name, email, geometry, point_count)
    values (${name}, ${email}, ${JSON.stringify(geometry)}::jsonb, ${pointCount})
  `;
}
