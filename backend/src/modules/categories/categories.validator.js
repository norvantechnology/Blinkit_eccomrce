const Joi = require('joi');

const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(120).required(),
  slug: Joi.string().max(140).optional(),
  imageUrl: Joi.string().uri().allow(null, '').optional(),
  parentId: Joi.string().uuid().allow(null).optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(1).max(120).optional(),
  slug: Joi.string().max(140).optional(),
  imageUrl: Joi.string().uri().allow(null, '').optional(),
  parentId: Joi.string().uuid().allow(null).optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = {
  idParamSchema,
  createCategorySchema,
  updateCategorySchema,
};
