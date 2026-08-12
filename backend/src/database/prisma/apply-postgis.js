#!/usr/bin/env node
/**
 * Apply PostGIS extension + GIST indexes. Safe to re-run (IF NOT EXISTS).
 */
const { loadSecrets } = require('../../config/loadSecrets');
const { PrismaClient } = require('@prisma/client');

const STATEMENTS = [
  'CREATE EXTENSION IF NOT EXISTS postgis',
  'CREATE INDEX IF NOT EXISTS idx_stores_location_gist ON stores USING GIST (location)',
  'CREATE INDEX IF NOT EXISTS idx_addresses_location_gist ON addresses USING GIST (location)',
];

const prisma = new PrismaClient();

async function main() {
  await loadSecrets();
  console.log('Applying PostGIS / GIST…');
  for (const statement of STATEMENTS) {
    await prisma.$executeRawUnsafe(statement);
    console.log(`  ✓ ${statement.slice(0, 72)}`);
  }
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error('Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
