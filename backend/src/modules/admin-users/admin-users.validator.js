const Joi = require('joi');
const { error } = require('../../utils/response');
const { email } = require('../../utils/joiSchemas');

const loginSchema = Joi.object({
  email: email().required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).required(),
});

const notImplemented = (_req, res) => error(res, 'Not implemented', 501);

module.exports = {
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  notImplemented,
};
