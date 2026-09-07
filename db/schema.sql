-- Easton People Council — Neon (Postgres) schema
--
-- There is no migration tool in this repo. This file is the whole schema and it
-- is idempotent, so re-running it is the update path:
--
--   npm run db:schema
--
-- Written by insertBoundary() in lib/db.ts, which inserts
-- (geometry, point_count) — every other column must keep a default or that
-- insert breaks. Read back by listBoundaries() in the same file.

-- No personal data lives in this table. A submitter's name and email go to
-- Qomon and nowhere else -- see app/api/boundary/route.ts. Nothing here links a
-- polygon to a person, which is the point.
create table if not exists boundary_submissions (
  id          bigint generated always as identity primary key,

  -- A GeoJSON Polygon: {"type":"Polygon","coordinates":[[[lng,lat],…]]}.
  -- The ring is closed and rounded to 5dp by parseRing()/toPolygon() in
  -- app/api/boundary/route.ts before it ever reaches here.
  geometry    jsonb       not null,

  -- Vertex count of the open ring the resident drew, i.e. before toPolygon()
  -- closes it. Stored rather than derived so a malformed row is still countable.
  point_count integer     not null,

  created_at  timestamptz not null default now(),

  constraint boundary_submissions_geometry_is_polygon
    check (geometry ->> 'type' = 'Polygon'),
  constraint boundary_submissions_point_count_min
    check (point_count >= 3)
);

-- Reviewing submissions is always "most recent first".
create index if not exists boundary_submissions_created_at_idx
  on boundary_submissions (created_at desc);

-- name and email were stored here originally. Dropping them is the migration:
-- these run on an existing database and are no-ops on a fresh one. Removing
-- the columns also destroys the values already in them, which is intended.
alter table boundary_submissions drop column if exists name;
alter table boundary_submissions drop column if exists email;
drop index if exists boundary_submissions_email_idx;


-- ── Optional: PostGIS ────────────────────────────────────────────────────────
--
-- Not required, and deliberately not enabled. jsonb is the source of truth and
-- the write path in lib/db.ts does not depend on any of this.
--
-- Aggregating what people drew into one consensus boundary is the actual point
-- of the exercise, and that is a spatial query. Neon ships PostGIS, so when
-- that day comes you do not need to change how rows are written — cast at read
-- time:
--
--   create extension if not exists postgis;
--
--   -- every submitted ring as real geometry
--   select id, st_geomfromgeojson(geometry) as geom from boundary_submissions;
--
--   -- the area at least half of respondents included
--   select st_asgeojson(
--            st_union(geom)
--          )
--   from (
--     select st_geomfromgeojson(geometry) as geom from boundary_submissions
--   ) s;
