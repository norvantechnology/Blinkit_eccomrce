const rbacService = require('../services/rbac.service');
const { AppError } = require('../utils/errors');

const authorize = (permissionKey) => {
  return async (req, _res, next) => {
    try {
      if (!req.admin) {
        throw new AppError('Admin authentication required', 401);
      }

      // super_admin bypasses all permission checks (§7.2)
      if (req.admin.role === 'super_admin') {
        return next();
      }

      const hasPermission = await rbacService.roleHasPermission(req.admin.roleId, permissionKey);

      if (!hasPermission) {
        throw new AppError('Forbidden: insufficient permissions', 403);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = authorize;
