const prisma = require('../../config/database');
const bcrypt = require('bcryptjs');

const findAdminByEmail = (email) => {
  return prisma.adminUser.findFirst({
    where: { email, deletedAt: null },
    include: { role: true },
  });
};

const findAdminById = (id) => {
  return prisma.adminUser.findFirst({
    where: { id, deletedAt: null, isActive: true },
    include: { role: true },
  });
};

const listPermissions = () => {
  return prisma.permission.findMany({
    orderBy: { key: 'asc' },
  });
};

const createAdminUser = async (data) => {
  const passwordHash = await bcrypt.hash(data.password, 12);
  return prisma.adminUser.create({
    data: { ...data, passwordHash },
    include: { role: true },
  });
};

const updatePassword = (id, passwordHash) => {
  return prisma.adminUser.update({
    where: { id },
    data: { passwordHash },
  });
};

module.exports = {
  findAdminByEmail,
  findAdminById,
  listPermissions,
  createAdminUser,
  updatePassword,
};
