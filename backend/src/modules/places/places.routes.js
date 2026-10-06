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

/** Map pin drag + "Go to current location" fire this often, so a looser limit than search. */
const reverseLimiter = rateLimiter({
  max: 120,
  windowSeconds: 600,
  keyGenerator: (req) => `places:reverse:${req.ip}`,
});

router.get(
  '/reverse',
  reverseLimiter,
  validateRequest(addressesValidator.reverseQuerySchema, 'query'),
  addressesController.reverse,
);

module.exports = router;
