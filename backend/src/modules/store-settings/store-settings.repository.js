const prisma = require('../../config/database');
const env = require('../../config/env');

const storeId = () => env.defaultStoreId;

const getSetting = async (key) => {
  const sid = storeId();
  if (!sid) return null;
  const row = await prisma.storeSetting.findUnique({
    where: { storeId_key: { storeId: sid, key } },
  });
  return row?.value ?? null;
};

const setSetting = async (key, value) => {
  const sid = storeId();
  if (!sid) throw new Error('DEFAULT_STORE_ID is not configured');
  return prisma.storeSetting.upsert({
    where: { storeId_key: { storeId: sid, key } },
    update: { value },
    create: { storeId: sid, key, value },
  });
};

module.exports = { getSetting, setSetting };
