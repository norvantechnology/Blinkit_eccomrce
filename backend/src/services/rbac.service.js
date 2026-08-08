const prisma = require('../config/database');
const redis = require('../config/redis');

const CACHE_PREFIX = 'rbac:role';
const CACHE_TTL_SECONDS = 3600;

const cacheKey = (roleId) => `${CACHE_PREFIX}:${roleId}:permissions`;

const getRolePermissions = async (roleId) => {
  const cached = await redis.get(cacheKey(roleId));
  if (cached) {
    return JSON.parse(cached);
  }

  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: { select: { key: true } } },
  });

  const permissions = rolePermissions.map((rp) => rp.permission.key);
  await redis.set(cacheKey(roleId), JSON.stringify(permissions), 'EX', CACHE_TTL_SECONDS);

  return permissions;
};

const invalidateRolePermissionCache = async (roleId) => {
  await redis.del(cacheKey(roleId));
};

const invalidateAllRolePermissionCaches = async () => {
  const keys = await redis.keys(`${CACHE_PREFIX}:*:permissions`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

const roleHasPermission = async (roleId, permissionKey) => {
  const permissions = await getRolePermissions(roleId);
  return permissions.includes(permissionKey);
};

module.exports = {
  getRolePermissions,
  invalidateRolePermissionCache,
  invalidateAllRolePermissionCaches,
  roleHasPermission,
};
