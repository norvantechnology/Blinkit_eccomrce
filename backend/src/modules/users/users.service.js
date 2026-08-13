const usersRepository = require('./users.repository');
const { AppError } = require('../../utils/errors');

const getMe = async (userId) => {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

const updateMe = async (userId, data) => {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const allowed = {};
  if (data.name !== undefined) allowed.name = data.name;
  if (data.email !== undefined) allowed.email = data.email;
  if (data.avatarUrl !== undefined) allowed.avatarUrl = data.avatarUrl;
  if (data.languagePref !== undefined) allowed.languagePref = data.languagePref;

  if (Object.keys(allowed).length === 0) {
    return user;
  }

  if (allowed.email) {
    const prisma = require('../../config/database');
    const existing = await prisma.user.findFirst({
      where: { email: allowed.email, deletedAt: null, NOT: { id: userId } },
    });
    if (existing) {
      throw new AppError('Email already in use', 409);
    }
  }

  return usersRepository.update(userId, allowed);
};

const updateLanguage = async (userId, languagePref) => {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return usersRepository.update(userId, { languagePref });
};

module.exports = { getMe, updateMe, updateLanguage };
