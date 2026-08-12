const prisma = require('../../config/database');

const findTopLevel = (storeId) =>
  prisma.category.findMany({
    where: { storeId, parentId: null, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

const findById = (id, storeId) =>
  prisma.category.findFirst({
    where: { id, ...(storeId ? { storeId } : {}) },
  });

const findSubcategories = (parentId, storeId) =>
  prisma.category.findMany({
    where: { parentId, storeId, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

const findAllAdmin = (storeId, { includeInactive = true } = {}) =>
  prisma.category.findMany({
    where: {
      storeId,
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      children: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
    },
  });

const create = (data) => prisma.category.create({ data });

const update = (id, data) =>
  prisma.category.update({
    where: { id },
    data,
  });

const remove = (id) => prisma.category.delete({ where: { id } });

const findBySlug = (storeId, slug) =>
  prisma.category.findUnique({
    where: { storeId_slug: { storeId, slug } },
  });

module.exports = {
  findTopLevel,
  findById,
  findSubcategories,
  findAllAdmin,
  create,
  update,
  remove,
  findBySlug,
};
