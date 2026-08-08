const Joi = require('joi');
const { success, error } = require('../../utils/response');
const { email } = require('../../utils/joiSchemas');

const sendOtpSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[1-9]\d{7,14}$/).required(),
});

const verifyOtpSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[1-9]\d{7,14}$/).required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  deviceId: Joi.string().max(255).optional(),
  fcmToken: Joi.string().optional().allow(null, ''),
  platform: Joi.string().valid('android', 'ios', 'web').optional(),
});

const registerSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{7,14}$/).optional(),
  email: email().optional(),
});

const loginEmailSchema = Joi.object({
  email: email().required(),
  password: Joi.string().min(6).required(),
  deviceId: Joi.string().max(255).optional(),
  fcmToken: Joi.string().optional().allow(null, ''),
  platform: Joi.string().valid('android', 'ios', 'web').optional(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
  deviceId: Joi.string().max(255).optional(),
});

const logoutSchema = Joi.object({
  deviceId: Joi.string().max(255).optional(),
});

const googleOAuthSchema = Joi.object({
  idToken: Joi.string().required(),
  deviceId: Joi.string().max(255).optional(),
  fcmToken: Joi.string().optional().allow(null, ''),
  platform: Joi.string().valid('android', 'ios', 'web').optional(),
});

const notImplemented = (_req, res) => {
  return error(res, 'Not implemented', 501);
};

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  registerSchema,
  loginEmailSchema,
  refreshTokenSchema,
  logoutSchema,
  googleOAuthSchema,
  notImplemented,
};
