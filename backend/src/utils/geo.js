const prisma = require('../config/database');

/**
 * PostGIS helper queries for geography columns.
 * Uses raw SQL since Prisma does not natively support geography types.
 */

const setPoint = async (table, id, lat, lng) => {
  await prisma.$executeRawUnsafe(
    `UPDATE ${table} SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3::uuid`,
    lng,
    lat,
    id,
  );
};

const getPointCoords = async (table, id) => {
  const result = await prisma.$queryRawUnsafe(
    `SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng FROM ${table} WHERE id = $1::uuid`,
    id,
  );
  return result[0] || null;
};

const findWithinRadius = async (table, lat, lng, radiusKm) => {
  return prisma.$queryRawUnsafe(
    `SELECT id, ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_m
     FROM ${table}
     WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
     ORDER BY distance_m`,
    lng,
    lat,
    radiusKm * 1000,
  );
};

module.exports = { setPoint, getPointCoords, findWithinRadius };
