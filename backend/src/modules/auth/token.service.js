const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const env = require('../../config/env');
const redis = require('../../config/redis');
const prisma = require('../../config/database');
const { AppError } = require('../../utils/errors');

const REFRESH_PREFIX_USER = 'refresh:user';
const REFRESH_PREFIX_ADMIN = 'refresh:admin';
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

const refreshCacheKey = (aud, sub, deviceId = null) => {
  if (aud === 'user') {
    return `${REFRESH_PREFIX_USER}:${sub}:${deviceId}`;
  }
  return `${REFRESH_PREFIX_ADMIN}:${sub}`;
};

/**
 * Persist hashed refresh token per §7.1:
 * - User: user_devices.refresh_token_hash (source of truth)
 * - Admin: admin_users.refresh_token_hash
 * Redis mirrors the hash for fast lookups (same TTL).
 */
const storeUserRefreshHash = async (userId, deviceId, refreshHash) => {
  await prisma.userDevice.upsert({
    where: { userId_deviceId: { userId, deviceId } },
    update: {
      refreshTokenHash: refreshHash,
      isRevoked: false,
      lastActiveAt: new Date(),
    },
    create: {
      userId,
      deviceId,
      refreshTokenHash: refreshHash,
      lastActiveAt: new Date(),
      isRevoked: false,
    },
  });
  await redis.set(refreshCacheKey('user', userId, deviceId), refreshHash, 'EX', REFRESH_TTL_SECONDS);
};

const storeAdminRefreshHash = async (adminId, refreshHash) => {
  await prisma.adminUser.update({
    where: { id: adminId },
    data: { refreshTokenHash: refreshHash },
  });
  await redis.set(refreshCacheKey('admin', adminId), refreshHash, 'EX', REFRESH_TTL_SECONDS);
};

const getStoredRefreshHash = async (aud, sub, deviceId = null) => {
  const cached = await redis.get(refreshCacheKey(aud, sub, deviceId));
  if (cached) return cached;

  if (aud === 'user') {
    const device = await prisma.userDevice.findUnique({
      where: { userId_deviceId: { userId: sub, deviceId: deviceId || 'default' } },
      select: { refreshTokenHash: true, isRevoked: true },
    });
    if (!device || device.isRevoked || !device.refreshTokenHash) return null;
    await redis.set(
      refreshCacheKey('user', sub, deviceId || 'default'),
      device.refreshTokenHash,
      'EX',
      REFRESH_TTL_SECONDS,
    );
    return device.refreshTokenHash;
  }

  const admin = await prisma.adminUser.findFirst({
    where: { id: sub, isActive: true, deletedAt: null },
    select: { refreshTokenHash: true },
  });
  if (!admin?.refreshTokenHash) return null;
  await redis.set(refreshCacheKey('admin', sub), admin.refreshTokenHash, 'EX', REFRESH_TTL_SECONDS);
  return admin.refreshTokenHash;
};

const clearUserRefreshHash = async (userId, deviceId = 'default') => {
  await prisma.userDevice.updateMany({
    where: { userId, deviceId },
    data: { refreshTokenHash: null, isRevoked: true },
  });
  await redis.del(refreshCacheKey('user', userId, deviceId));
};

const clearAdminRefreshHash = async (adminId) => {
  await prisma.adminUser.updateMany({
    where: { id: adminId },
    data: { refreshTokenHash: null },
  });
  await redis.del(refreshCacheKey('admin', adminId));
};

const issueUserTokens = async (user, deviceId = 'default') => {
  const accessToken = jwt.sign(
    { sub: user.id, aud: 'user', type: 'access' },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiry },
  );

  const refreshToken = jwt.sign(
    { sub: user.id, aud: 'user', type: 'refresh', deviceId, jti: uuidv4() },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiry },
  );

  const refreshHash = await bcrypt.hash(refreshToken, 10);
  await storeUserRefreshHash(user.id, deviceId, refreshHash);

  return { accessToken, refreshToken };
};

const issueAdminTokens = async (admin, permissions) => {
  const accessToken = jwt.sign(
    {
      sub: admin.id,
      aud: 'admin',
      type: 'access',
      roleId: admin.roleId,
      role: admin.role?.name || admin.roleName,
      permissions,
    },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.adminAccessExpiry },
  );

  const refreshToken = jwt.sign(
    { sub: admin.id, aud: 'admin', type: 'refresh', jti: uuidv4() },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiry },
  );

  const refreshHash = await bcrypt.hash(refreshToken, 10);
  await storeAdminRefreshHash(admin.id, refreshHash);

  return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.accessSecret);
  } catch {
    throw new AppError('Invalid or expired access token', 401);
  }
};

const rotateRefreshToken = async (refreshToken) => {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  if (payload.type !== 'refresh') {
    throw new AppError('Invalid refresh token', 401);
  }

  const deviceId = payload.deviceId || 'default';
  const storedHash = await getStoredRefreshHash(payload.aud, payload.sub, deviceId);

  if (!storedHash) {
    throw new AppError('Refresh token revoked or expired', 401);
  }

  const valid = await bcrypt.compare(refreshToken, storedHash);
  if (!valid) {
    throw new AppError('Invalid refresh token', 401);
  }

  // Invalidate current token before caller issues a new pair (rotation)
  if (payload.aud === 'user') {
    await clearUserRefreshHash(payload.sub, deviceId);
  } else {
    await clearAdminRefreshHash(payload.sub);
  }

  return payload;
};

const revokeUserRefreshToken = async (userId, deviceId = 'default') => {
  await clearUserRefreshHash(userId, deviceId);
};

const revokeAdminRefreshToken = async (adminId) => {
  await clearAdminRefreshHash(adminId);
};

const RESET_PREFIX = 'admin:password_reset';
const RESET_TTL_SECONDS = 15 * 60;

const issueAdminPasswordResetToken = async (adminId) => {
  const token = jwt.sign(
    { sub: adminId, aud: 'admin', type: 'password_reset', jti: uuidv4() },
    env.jwt.refreshSecret,
    { expiresIn: '15m' },
  );

  const hash = await bcrypt.hash(token, 10);
  await redis.set(`${RESET_PREFIX}:${adminId}`, hash, 'EX', RESET_TTL_SECONDS);

  return token;
};

const verifyAdminPasswordResetToken = async (token) => {
  let payload;
  try {
    payload = jwt.verify(token, env.jwt.refreshSecret);
  } catch {
    throw new AppError('Invalid or expired reset token', 400);
  }

  if (payload.type !== 'password_reset' || payload.aud !== 'admin') {
    throw new AppError('Invalid reset token', 400);
  }

  const storedHash = await redis.get(`${RESET_PREFIX}:${payload.sub}`);
  if (!storedHash) {
    throw new AppError('Reset token expired or already used', 400);
  }

  const valid = await bcrypt.compare(token, storedHash);
  if (!valid) {
    throw new AppError('Invalid reset token', 400);
  }

  await redis.del(`${RESET_PREFIX}:${payload.sub}`);
  return payload.sub;
};

module.exports = {
  issueUserTokens,
  issueAdminTokens,
  verifyAccessToken,
  rotateRefreshToken,
  revokeUserRefreshToken,
  revokeAdminRefreshToken,
  issueAdminPasswordResetToken,
  verifyAdminPasswordResetToken,
};
