const { Router } = require('express');
const controller = require('./country-codes.controller');
const validator = require('./country-codes.validator');
const validateRequest = require('../../middlewares/validateRequest');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');

const publicRouter = Router();

publicRouter.get('/', controller.listPublic);

const adminRouter = Router();

adminRouter.use(authenticate('admin'), authorize('store.manage'));

adminRouter.get('/', controller.listAdmin);
adminRouter.post('/', validateRequest(validator.createSchema), controller.create);
adminRouter.patch(
  '/:id',
  validateRequest(validator.idParamSchema, 'params'),
  validateRequest(validator.updateSchema),
  controller.update,
);
adminRouter.delete(
  '/:id',
  validateRequest(validator.idParamSchema, 'params'),
  controller.remove,
);

module.exports = { publicRouter, adminRouter };
