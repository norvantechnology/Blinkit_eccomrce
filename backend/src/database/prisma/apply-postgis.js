#!/usr/bin/env node
/**
 * Apply PostGIS extension + GIST indexes after schema push.
 * Safe to re-run (IF NOT EXISTS).
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const sqlPath = path.join(__dirname, 'migrations/0001_postgis_indexes/migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split on statements; Prisma $executeRawUnsafe runs one at a time
  const statements = sql
    .split(';')
    .map((s) => s.replace(/--[^\n]*/g, '').trim())
    .filter(Boolean);

  console.log('Applying PostGIS / GIST migrations...');
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
    console.log(`  ✓ ${statement.split('\n')[0].slice(0, 72)}...`);
  }
  console.log('Migrations applied.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
