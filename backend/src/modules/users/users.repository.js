const prisma = require('../../config/database');

const findById = (id) => {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      phone: true,
      email: true,
      name: true,
      languagePref: true,
      authProvider: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

const update = (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      phone: true,
      email: true,
      name: true,
      languagePref: true,
      authProvider: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

module.exports = { findById, update };
