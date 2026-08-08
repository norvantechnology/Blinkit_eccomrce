const prisma = require('../config/database');
const tokenService = require('../modules/auth/token.service');
const { AppError } = require('../utils/errors');

const buildAuthenticate = (requiredAud = null) => {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        throw new AppError('Authentication required', 401);
      }

      const token = header.slice(7);
      const payload = tokenService.verifyAccessToken(token);

      if (payload.type !== 'access') {
        throw new AppError('Invalid access token', 401);
      }

      if (requiredAud && payload.aud !== requiredAud) {
        throw new AppError('Invalid token for this resource', 403);
      }

      if (payload.aud === 'admin') {
        const admin = await prisma.adminUser.findFirst({
          where: { id: payload.sub, isActive: true, deletedAt: null },
          include: { role: true },
        });

        if (!admin) {
          throw new AppError('Admin account not found or inactive', 401);
        }

        req.admin = {
          id: admin.id,
          roleId: admin.roleId,
          role: admin.role.name,
          email: admin.email,
          name: admin.name,
          storeId: admin.storeId,
          permissions: payload.permissions || [],
        };
      } else if (payload.aud === 'user') {
        const user = await prisma.user.findFirst({
          where: { id: payload.sub, isActive: true, deletedAt: null },
        });

        if (!user) {
          throw new AppError('User account not found or inactive', 401);
        }

        req.user = {
          id: user.id,
          phone: user.phone,
          email: user.email,
          name: user.name,
          languagePref: user.languagePref,
          authProvider: user.authProvider,
        };
      } else {
        throw new AppError('Invalid token audience', 401);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = buildAuthenticate;
