const { Router } = require('express');
const addressesController = require('./addresses.controller');
const addressesValidator = require('./addresses.validator');
const validateRequest = require('../../middlewares/validateRequest');
const authenticate = require('../../middlewares/authenticate');

const router = Router();

router.use(authenticate('user'));

router.get(
  '/search',
  validateRequest(addressesValidator.searchQuerySchema, 'query'),
  addressesController.search,
);

router.get('/', addressesController.list);

router.post(
  '/',
  validateRequest(addressesValidator.createAddressSchema),
  addressesController.create,
);

router.patch(
  '/:id/default',
  validateRequest(addressesValidator.addressIdParamSchema, 'params'),
  addressesController.setDefault,
);

router.patch(
  '/:id',
  validateRequest(addressesValidator.addressIdParamSchema, 'params'),
  validateRequest(addressesValidator.updateAddressSchema),
  addressesController.update,
);

router.delete(
  '/:id',
  validateRequest(addressesValidator.addressIdParamSchema, 'params'),
  addressesController.remove,
);

module.exports = router;
