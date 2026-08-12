const Joi = require('joi');
const { email } = require('../../utils/joiSchemas');

const updateMeSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  email: email().optional(),
  /** Public S3 URL from POST /uploads or /uploads/presign */
  avatarUrl: Joi.string().uri({ scheme: ['http', 'https'] }).max(1000).allow(null).optional(),
}).min(1);

const updateLanguageSchema = Joi.object({
  languagePref: Joi.string().min(2).max(10).required(),
});

module.exports = { updateMeSchema, updateLanguageSchema };
