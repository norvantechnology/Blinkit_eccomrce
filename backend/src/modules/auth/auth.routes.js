const { Router } = require('express');
const authController = require('./auth.controller');
const authValidator = require('./auth.validator');
const validateRequest = require('../../middlewares/validateRequest');
const authenticate = require('../../middlewares/authenticate');
const rateLimiter = require('../../middlewares/rateLimiter');

const router = Router();

const otpSendLimiter = rateLimiter({
  max: 3,
  windowSeconds: 600,
  keyGenerator: (req) => `otp:send:${req.body.phone || req.ip}`,
});

const otpVerifyLimiter = rateLimiter({
  max: 10,
  windowSeconds: 600,
  keyGenerator: (req) => `otp:verify:${req.body.phone || req.ip}`,
});

const authIpLimiter = rateLimiter({
  max: 20,
  windowSeconds: 600,
  keyGenerator: (req) => `auth:ip:${req.ip}`,
});

router.post(
  '/otp/send',
  validateRequest(authValidator.sendOtpSchema),
  otpSendLimiter,
  authController.sendOtp,
);

router.post(
  '/otp/verify',
  validateRequest(authValidator.verifyOtpSchema),
  otpVerifyLimiter,
  authController.verifyOtp,
);

router.post(
  '/register',
  authenticate('user'),
  validateRequest(authValidator.registerSchema),
  authController.register,
);

router.post(
  '/login/email',
  validateRequest(authValidator.loginEmailSchema),
  authIpLimiter,
  authController.loginEmail,
);

router.post(
  '/oauth/google',
  validateRequest(authValidator.googleOAuthSchema),
  authIpLimiter,
  authController.loginGoogle,
);
router.post('/oauth/apple', authValidator.notImplemented);
router.post('/firebase/verify', authValidator.notImplemented);

router.post(
  '/refresh-token',
  validateRequest(authValidator.refreshTokenSchema),
  authIpLimiter,
  authController.refreshToken,
);

router.post(
  '/logout',
  authenticate('user'),
  validateRequest(authValidator.logoutSchema),
  authController.logout,
);

router.delete('/account', authenticate('user'), authController.deleteAccount);

module.exports = router;
