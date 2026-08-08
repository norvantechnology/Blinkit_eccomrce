#!/bin/sh
set -e

echo "Starting Blinkit backend..."

if [ "${RUN_DB_SETUP}" = "1" ] || [ "${RUN_DB_SETUP}" = "true" ]; then
  echo "Running Prisma db push..."
  npx prisma db push --schema=src/database/prisma/schema.prisma --skip-generate
  echo "Applying PostGIS / GIST migrations..."
  node src/database/prisma/apply-postgis.js
  echo "Seeding database..."
  node src/database/prisma/seed.js
fi

exec "$@"
