/**
 * Ensure live Postgres supports email OTP login.
 * Safe / idempotent — safe to run on every boot.
 *
 * Fixes common prod gaps after email-OTP was added in code but never db-pushed:
 * - AuthProvider enum missing `email`
 * - otp_verifications.email column missing
 * - otp_verifications.phone still NOT NULL
 */
const { PrismaClient } = require('@prisma/client');
const logger = require('../../utils/logger');

const ensureEmailAuthSchema = async () => {
  const prisma = new PrismaClient();
  try {
    // AuthProvider.email (Prisma enum name matches PG type "AuthProvider")
    // Prefer IF NOT EXISTS outside a DO block — ADD VALUE is awkward inside transactions.
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TYPE "AuthProvider" ADD VALUE IF NOT EXISTS 'email'`,
      );
    } catch (err) {
      const msg = err.message || '';
      // Older PG without IF NOT EXISTS, or value already present under another path
      if (!/already exists|duplicate/i.test(msg)) {
        await prisma.$executeRawUnsafe(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1
              FROM pg_enum e
              JOIN pg_type t ON t.oid = e.enumtypid
              WHERE t.typname = 'AuthProvider'
                AND e.enumlabel = 'email'
            ) THEN
              ALTER TYPE "AuthProvider" ADD VALUE 'email';
            END IF;
          END
          $$;
        `);
      }
    }

    // otp_verifications.email + nullable phone
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "otp_verifications"
        ADD COLUMN IF NOT EXISTS "email" TEXT;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'otp_verifications'
            AND column_name = 'phone'
            AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE "otp_verifications" ALTER COLUMN "phone" DROP NOT NULL;
        END IF;
      END
      $$;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "otp_verifications_email_purpose_idx"
        ON "otp_verifications" ("email", "purpose");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "users_email_idx"
        ON "users" ("email");
    `);

    logger.info('[schema] Email OTP schema ensured (AuthProvider.email + otp_verifications.email)');
  } catch (err) {
    logger.error('[schema] Failed to ensure email OTP schema', { error: err.message });
    throw err;
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = { ensureEmailAuthSchema };
