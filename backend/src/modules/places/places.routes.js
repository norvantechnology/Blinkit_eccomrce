const { Router } = require('express');
const addressesController = require('../addresses/addresses.controller');
const addressesValidator = require('../addresses/addresses.validator');
const validateRequest = require('../../middlewares/validateRequest');
const rateLimiter = require('../../middlewares/rateLimiter');

const router = Router();

/** Public address search - Google Places when MAPS_API_KEY is set (guest + logged-in). */
const searchLimiter = rateLimiter({
  max: 60,
  windowSeconds: 600,
  keyGenerator: (req) => `places:search:${req.ip}`,
});

router.get(
  '/search',
  searchLimiter,
  validateRequest(addressesValidator.searchQuerySchema, 'query'),
  addressesController.search,
);

module.exports = router;
