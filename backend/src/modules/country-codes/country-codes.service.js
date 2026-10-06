const repo = require('./country-codes.repository');
const { AppError } = require('../../utils/errors');

const FALLBACK = {
  id: null,
  name: 'India',
  isoCode: 'IN',
  dialCode: '+91',
  flag: '🇮🇳',
  minLength: 10,
  maxLength: 10,
  isActive: true,
  isDefault: true,
  sortOrder: 0,
};

const toPublic = (row) => ({
  id: row.id,
  name: row.name,
  isoCode: row.isoCode,
  dialCode: row.dialCode,
  flag: row.flag,
  minLength: row.minLength,
  maxLength: row.maxLength,
  isDefault: row.isDefault,
});

/** Active codes for the login screen; never empty so the phone login keeps working. */
const listPublic = async () => {
  const rows = await repo.listActive();
  const list = rows.length ? rows : [FALLBACK];
  if (!list.some((r) => r.isDefault)) list[0] = { ...list[0], isDefault: true };
  return list.map(toPublic);
};

const listAdmin = () => repo.listAll();

const assertLengths = ({ minLength, maxLength }) => {
  if (minLength != null && maxLength != null && minLength > maxLength) {
    throw new AppError('Minimum length cannot be greater than maximum length', 400);
  }
};

const create = async (payload) => {
  assertLengths(payload);
  if (await repo.findByIso(payload.isoCode)) {
    throw new AppError(`Country ${payload.isoCode} already exists`, 409);
  }
  return repo.create(payload);
};

const update = async (id, payload) => {
  const existing = await repo.findById(id);
  if (!existing) throw new AppError('Country code not found', 404);
  assertLengths({
    minLength: payload.minLength ?? existing.minLength,
    maxLength: payload.maxLength ?? existing.maxLength,
  });
  if (payload.isoCode && payload.isoCode !== existing.isoCode) {
    if (await repo.findByIso(payload.isoCode)) {
      throw new AppError(`Country ${payload.isoCode} already exists`, 409);
    }
  }
  if (payload.isActive === false && (payload.isDefault ?? existing.isDefault)) {
    throw new AppError('Default country cannot be disabled - set another default first', 400);
  }
  return repo.update(id, payload);
};

const remove = async (id) => {
  const existing = await repo.findById(id);
  if (!existing) throw new AppError('Country code not found', 404);
  if (existing.isDefault) {
    throw new AppError('Default country cannot be deleted - set another default first', 400);
  }
  await repo.remove(id);
  return { id };
};

module.exports = { listPublic, listAdmin, create, update, remove };
