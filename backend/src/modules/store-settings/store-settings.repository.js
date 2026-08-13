const prisma = require('../../config/database');
const env = require('../../config/env');

let cachedStoreId = null;

const resolveStoreId = async () => {
  if (env.defaultStoreId) return env.defaultStoreId;
  if (cachedStoreId) return cachedStoreId;
  const store = await prisma.store.findFirst({
    where: { isActive: true },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  cachedStoreId = store?.id || null;
  return cachedStoreId;
};

const getSetting = async (key) => {
  const sid = await resolveStoreId();
  if (!sid) return null;
  const row = await prisma.storeSetting.findUnique({
    where: { storeId_key: { storeId: sid, key } },
  });
  return row?.value ?? null;
};

const setSetting = async (key, value) => {
  const sid = await resolveStoreId();
  if (!sid) throw new Error('DEFAULT_STORE_ID is not configured and no store exists');
  return prisma.storeSetting.upsert({
    where: { storeId_key: { storeId: sid, key } },
    update: { value },
    create: { storeId: sid, key, value },
  });
};

module.exports = { getSetting, setSetting };
