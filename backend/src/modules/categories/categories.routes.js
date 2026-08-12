const { Router } = require('express');
const categoriesController = require('./categories.controller');
const categoriesValidator = require('./categories.validator');
const validateRequest = require('../../middlewares/validateRequest');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { PERMISSIONS } = require('../../config/constants');

const publicRouter = Router();

publicRouter.get('/', categoriesController.list);
publicRouter.get(
  '/:id/subcategories',
  validateRequest(categoriesValidator.idParamSchema, 'params'),
  categoriesController.subcategories,
);

const adminRouter = Router();

adminRouter.use(authenticate('admin'));

adminRouter.get(
  '/categories',
  authorize(PERMISSIONS.CATEGORIES_MANAGE),
  categoriesController.adminList,
);

adminRouter.post(
  '/categories',
  authorize(PERMISSIONS.CATEGORIES_MANAGE),
  validateRequest(categoriesValidator.createCategorySchema),
  categoriesController.adminCreate,
);

adminRouter.patch(
  '/categories/:id',
  authorize(PERMISSIONS.CATEGORIES_MANAGE),
  validateRequest(categoriesValidator.idParamSchema, 'params'),
  validateRequest(categoriesValidator.updateCategorySchema),
  categoriesController.adminUpdate,
);

adminRouter.delete(
  '/categories/:id',
  authorize(PERMISSIONS.CATEGORIES_MANAGE),
  validateRequest(categoriesValidator.idParamSchema, 'params'),
  categoriesController.adminRemove,
);

adminRouter.get(
  '/categories/:id/subcategories',
  authorize(PERMISSIONS.CATEGORIES_MANAGE),
  validateRequest(categoriesValidator.idParamSchema, 'params'),
  categoriesController.adminListSubcategories,
);

adminRouter.post(
  '/categories/:id/subcategories',
  authorize(PERMISSIONS.CATEGORIES_MANAGE),
  validateRequest(categoriesValidator.idParamSchema, 'params'),
  validateRequest(categoriesValidator.createCategorySchema),
  categoriesController.adminCreateSubcategory,
);

module.exports = { publicRouter, adminRouter };
