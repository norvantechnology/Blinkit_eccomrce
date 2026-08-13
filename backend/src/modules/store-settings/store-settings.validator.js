const Joi = require('joi');

const updatePrivacyPolicySchema = Joi.object({
  locale: Joi.string().valid('en', 'hi').default('en'),
  markdown: Joi.string().min(20).max(50000).required(),
});

module.exports = { updatePrivacyPolicySchema };
