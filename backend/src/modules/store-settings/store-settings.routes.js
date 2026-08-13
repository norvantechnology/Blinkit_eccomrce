const { Router } = require('express');
const controller = require('./store-settings.controller');
const validator = require('./store-settings.validator');
const validateRequest = require('../../middlewares/validateRequest');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');

const publicRouter = Router();

publicRouter.get('/privacy-policy', controller.getPublicPrivacyPolicy);

const adminRouter = Router();

adminRouter.get(
  '/privacy-policy',
  authenticate('admin'),
  authorize('store.manage'),
  controller.getAdminPrivacyPolicy,
);

adminRouter.patch(
  '/privacy-policy',
  authenticate('admin'),
  authorize('store.manage'),
  validateRequest(validator.updatePrivacyPolicySchema),
  controller.updatePrivacyPolicy,
);

module.exports = { publicRouter, adminRouter };
