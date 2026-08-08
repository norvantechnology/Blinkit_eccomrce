-- Enable PostGIS and create GIST indexes on geography columns.
-- Applied after Prisma initial migration.

CREATE EXTENSION IF NOT EXISTS postgis;

-- GIST index on stores.location for ST_DWithin / nearest-area queries
CREATE INDEX IF NOT EXISTS idx_stores_location_gist
  ON stores USING GIST (location);

-- GIST index on addresses.location
CREATE INDEX IF NOT EXISTS idx_addresses_location_gist
  ON addresses USING GIST (location);
