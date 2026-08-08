const Joi = require('joi');

const createAddressSchema = Joi.object({
  label: Joi.string().valid('home', 'work', 'other').default('home'),
  fullAddress: Joi.string().min(5).max(500).required(),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  landmark: Joi.string().max(255).optional().allow(null, ''),
  isDefault: Joi.boolean().optional(),
});

const updateAddressSchema = Joi.object({
  label: Joi.string().valid('home', 'work', 'other').optional(),
  fullAddress: Joi.string().min(5).max(500).optional(),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  landmark: Joi.string().max(255).optional().allow(null, ''),
  isDefault: Joi.boolean().optional(),
}).min(1);

const addressIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const searchQuerySchema = Joi.object({
  q: Joi.string().min(2).max(200).required(),
});

module.exports = {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
  searchQuerySchema,
};
