const prisma = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const { getPointCoords } = require('../../utils/geo');

const findByUserId = async (userId) => {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return Promise.all(addresses.map(enrichWithCoords));
};

const findById = async (id, userId) => {
  const address = await prisma.address.findFirst({
    where: { id, userId },
  });
  if (!address) return null;
  return enrichWithCoords(address);
};

const enrichWithCoords = async (address) => {
  const coords = await getPointCoords('addresses', address.id);
  return {
    ...address,
    lat: coords ? Number(coords.lat) : null,
    lng: coords ? Number(coords.lng) : null,
  };
};

const create = async (userId, { label, fullAddress, lat, lng, landmark, isDefault }) => {
  const id = uuidv4();

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  await prisma.$executeRaw`
    INSERT INTO addresses (id, user_id, label, full_address, location, landmark, is_default, created_at, updated_at)
    VALUES (
      ${id}::uuid,
      ${userId}::uuid,
      ${label}::"AddressLabel",
      ${fullAddress},
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
      ${landmark || null},
      ${isDefault ?? false},
      NOW(),
      NOW()
    )
  `;

  return findById(id, userId);
};

const update = async (id, userId, { label, fullAddress, lat, lng, landmark, isDefault }) => {
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) return null;

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId, NOT: { id } },
      data: { isDefault: false },
    });
  }

  await prisma.address.update({
    where: { id },
    data: {
      ...(label !== undefined && { label }),
      ...(fullAddress !== undefined && { fullAddress }),
      ...(landmark !== undefined && { landmark }),
      ...(isDefault !== undefined && { isDefault }),
    },
  });

  if (lat !== undefined && lng !== undefined) {
    await prisma.$executeRaw`
      UPDATE addresses
      SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      WHERE id = ${id}::uuid
    `;
  }

  return findById(id, userId);
};

const remove = async (id, userId) => {
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) return null;

  await prisma.address.delete({ where: { id } });
  return existing;
};

const setDefault = async (id, userId) => {
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) return null;

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id },
      data: { isDefault: true },
    }),
  ]);

  return findById(id, userId);
};

module.exports = {
  findByUserId,
  findById,
  create,
  update,
  remove,
  setDefault,
};
