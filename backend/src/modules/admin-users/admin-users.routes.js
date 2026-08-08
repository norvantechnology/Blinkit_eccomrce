const { Router } = require('express');
const adminController = require('./admin-users.controller');
const adminValidator = require('./admin-users.validator');
const validateRequest = require('../../middlewares/validateRequest');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');

const authRouter = Router();

authRouter.post(
  '/login',
  validateRequest(adminValidator.loginSchema),
  adminController.login,
);

authRouter.post(
  '/refresh-token',
  validateRequest(adminValidator.refreshTokenSchema),
  adminController.refreshToken,
);

authRouter.post('/logout', authenticate('admin'), adminController.logout);

authRouter.post(
  '/forgot-password',
  validateRequest(adminValidator.forgotPasswordSchema),
  adminController.forgotPassword,
);

authRouter.post(
  '/reset-password',
  validateRequest(adminValidator.resetPasswordSchema),
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
