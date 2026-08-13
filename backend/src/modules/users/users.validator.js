const Joi = require('joi');
const { email } = require('../../utils/joiSchemas');

const updateMeSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  email: email().optional(),
  /** Public S3 URL from POST /uploads or /uploads/presign */
  avatarUrl: Joi.string().uri({ scheme: ['http', 'https'] }).max(1000).allow(null).optional(),
  languagePref: Joi.string().valid('en', 'hi').optional(),
}).min(1);

const updateLanguageSchema = Joi.object({
  languagePref: Joi.string().valid('en', 'hi').required(),
});

module.exports = { updateMeSchema, updateLanguageSchema };
