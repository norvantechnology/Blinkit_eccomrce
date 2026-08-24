const prisma = require('../../config/database');
const { OTP_PURPOSE } = require('../../config/constants');

const findLatestOtp = ({ phone, email } = {}, purpose = OTP_PURPOSE.LOGIN) => {
  if (!phone && !email) return null;

  return prisma.otpVerification.findFirst({
    where: {
      ...(phone ? { phone } : { email }),
      purpose,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const createOtp = (data) => prisma.otpVerification.create({ data });

const incrementOtpAttempts = (id, attempts) => {
  return prisma.otpVerification.update({
    where: { id },
    data: { attempts },
  });
};

const markOtpVerified = (id) => {
  return prisma.otpVerification.update({
    where: { id },
    data: { verifiedAt: new Date() },
  });
};

const findUserByPhone = (phone) => {
  return prisma.user.findFirst({
    where: { phone, deletedAt: null },
  });
};

const findUserByEmail = (email) => {
  return prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
};

const findUserByProvider = (authProvider, providerId) => {
  return prisma.user.findFirst({
    where: { authProvider, providerId, deletedAt: null },
  });
};

const findUserById = (id) => {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
  });
};

const createUser = (data) => prisma.user.create({ data });

const updateUser = (id, data) => prisma.user.update({ where: { id }, data });

const upsertUserDevice = (userId, deviceId, data) => {
  const updateData = { ...data, lastActiveAt: new Date() };
  if (data.isRevoked === undefined) {
    updateData.isRevoked = false;
  }

  return prisma.userDevice.upsert({
    where: { userId_deviceId: { userId, deviceId } },
    update: updateData,
    create: { userId, deviceId, ...data, lastActiveAt: new Date(), isRevoked: data.isRevoked ?? false },
  });
};

const revokeAllUserDevices = (userId) => {
  return prisma.userDevice.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
};

const softDeleteUser = (id) => {
  return prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false, phone: null, email: null, name: 'Deleted User' },
  });
};

module.exports = {
  findLatestOtp,
  createOtp,
  incrementOtpAttempts,
  markOtpVerified,
  findUserByPhone,
  findUserByEmail,
  findUserByProvider,
  findUserById,
  createUser,
  updateUser,
  upsertUserDevice,
  revokeAllUserDevices,
  softDeleteUser,
};
