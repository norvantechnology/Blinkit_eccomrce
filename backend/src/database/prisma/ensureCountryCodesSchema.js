/**
 * Ensure the login country-code table exists (deploy does not run prisma db push).
 * Idempotent - safe to run on every boot. Column types mirror the Prisma CountryCode model.
 * Seeds India (+91, default), United States (+1) and Canada (+1) only when the table is empty.
 */
const { PrismaClient } = require('@prisma/client');
const logger = require('../../utils/logger');

const ensureCountryCodesSchema = async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "country_codes" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "iso_code" VARCHAR(2) NOT NULL,
        "dial_code" VARCHAR(6) NOT NULL,
        "flag" TEXT,
        "min_length" INTEGER NOT NULL DEFAULT 10,
        "max_length" INTEGER NOT NULL DEFAULT 10,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "is_default" BOOLEAN NOT NULL DEFAULT false,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "country_codes_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "country_codes_iso_code_key"
        ON "country_codes" ("iso_code");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "country_codes_is_active_sort_order_idx"
        ON "country_codes" ("is_active", "sort_order");
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO "country_codes"
        ("name", "iso_code", "dial_code", "flag", "min_length", "max_length", "is_active", "is_default", "sort_order")
      SELECT v.* FROM (VALUES
        ('India', 'IN', '+91', '🇮🇳', 10, 10, true, true, 0),
        ('United States', 'US', '+1', '🇺🇸', 10, 10, true, false, 1),
        ('Canada', 'CA', '+1', '🇨🇦', 10, 10, true, false, 2)
      ) AS v
      WHERE NOT EXISTS (SELECT 1 FROM "country_codes");
    `);

    logger.info('[schema] Country codes table ensured');
  } catch (err) {
    logger.error('[schema] Failed to ensure country codes table', { error: err.message });
    throw err;
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = { ensureCountryCodesSchema };
