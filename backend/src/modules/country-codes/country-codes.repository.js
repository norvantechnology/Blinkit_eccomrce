const prisma = require('../../config/database');

const ORDER = [{ sortOrder: 'asc' }, { name: 'asc' }];

const listActive = () => prisma.countryCode.findMany({ where: { isActive: true }, orderBy: ORDER });

const listAll = () => prisma.countryCode.findMany({ orderBy: ORDER });

const findById = (id) => prisma.countryCode.findUnique({ where: { id } });

const findByIso = (isoCode) => prisma.countryCode.findUnique({ where: { isoCode } });

/** Writes that set isDefault clear the flag on every other row in the same transaction. */
const create = (data) =>
  prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.countryCode.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    return tx.countryCode.create({ data });
  });

const update = (id, data) =>
  prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.countryCode.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }
    return tx.countryCode.update({ where: { id }, data });
  });

const remove = (id) => prisma.countryCode.delete({ where: { id } });

module.exports = { listActive, listAll, findById, findByIso, create, update, remove };
