const Joi = require('joi');

const fields = {
  name: Joi.string().trim().min(2).max(60),
  isoCode: Joi.string().trim().uppercase().pattern(/^[A-Z]{2}$/).messages({
    'string.pattern.base': 'ISO code must be 2 letters (e.g. IN, US)',
  }),
  dialCode: Joi.string().trim().pattern(/^\+[1-9]\d{0,4}$/).messages({
    'string.pattern.base': 'Dial code must look like +91 or +1',
  }),
  flag: Joi.string().trim().max(16).allow('', null),
  minLength: Joi.number().integer().min(4).max(14),
  maxLength: Joi.number().integer().min(4).max(14),
  isActive: Joi.boolean(),
  isDefault: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0).max(9999),
};

const createSchema = Joi.object({
  ...fields,
  name: fields.name.required(),
  isoCode: fields.isoCode.required(),
  dialCode: fields.dialCode.required(),
  minLength: fields.minLength.default(10),
  maxLength: fields.maxLength.default(10),
});

const updateSchema = Joi.object(fields).min(1);

const idParamSchema = Joi.object({
  id: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] }).required(),
});

module.exports = { createSchema, updateSchema, idParamSchema };
