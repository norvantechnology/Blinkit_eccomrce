const { Router } = require('express');
const adminController = require('./admin-users.controller');
const adminValidator = require('./admin-users.validator');
const validateRequest = require('../../middlewares/validateRequest');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const rateLimiter = require('../../middlewares/rateLimiter');

const authRouter = Router();

const adminAuthLimiter = rateLimiter({
  max: 15,
  windowSeconds: 600,
  keyGenerator: (req) => `admin:auth:${req.ip}`,
});

authRouter.post(
  '/login',
  validateRequest(adminValidator.loginSchema),
  adminAuthLimiter,
  adminController.login,
);

authRouter.post(
  '/refresh-token',
  validateRequest(adminValidator.refreshTokenSchema),
  adminAuthLimiter,
  adminController.refreshToken,
);

authRouter.post('/logout', authenticate('admin'), adminController.logout);

authRouter.post(
  '/forgot-password',
  validateRequest(adminValidator.forgotPasswordSchema),
  adminAuthLimiter,
  adminController.forgotPassword,
);

authRouter.post(
  '/reset-password',
  validateRequest(adminValidator.resetPasswordSchema),
  adminAuthLimiter,
  adminController.resetPassword,
);

const adminRouter = Router();

adminRouter.get(
  '/permissions',
  authenticate('admin'),
  authorize('roles.manage'),
  adminController.listPermissions,
);

module.exports = { authRouter, adminRouter };
