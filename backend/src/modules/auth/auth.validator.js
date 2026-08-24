const Joi = require('joi');
const { error } = require('../../utils/response');
const { email } = require('../../utils/joiSchemas');

const phoneSchema = Joi.string().pattern(/^\+?[1-9]\d{7,14}$/);

const sendOtpSchema = Joi.object({
  phone: phoneSchema.optional(),
  email: email().optional(),
})
  .xor('phone', 'email')
  .messages({
    'object.xor': 'Provide either phone or email',
    'object.missing': 'Phone or email is required',
  });

const verifyOtpSchema = Joi.object({
  phone: phoneSchema.optional(),
  email: email().optional(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  deviceId: Joi.string().max(255).optional(),
  fcmToken: Joi.string().optional().allow(null, ''),
  platform: Joi.string().valid('android', 'ios', 'web').optional(),
})
  .xor('phone', 'email')
  .messages({
    'object.xor': 'Provide either phone or email',
    'object.missing': 'Phone or email is required',
  });

const registerSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  phone: phoneSchema.optional(),
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

const appleOAuthSchema = Joi.object({
  idToken: Joi.string().required(),
  email: email().optional().allow(null, ''),
  name: Joi.string().max(100).optional().allow(null, ''),
  deviceId: Joi.string().max(255).optional(),
  fcmToken: Joi.string().optional().allow(null, ''),
  platform: Joi.string().valid('android', 'ios', 'web').optional(),
});

const setPasswordSchema = Joi.object({
  password: Joi.string().min(6).max(128).required(),
});

const deleteAccountSchema = Joi.object({
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
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
  appleOAuthSchema,
  setPasswordSchema,
  deleteAccountSchema,
  notImplemented,
};
