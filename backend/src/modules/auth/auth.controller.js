const authService = require('./auth.service');
const { success, error } = require('../../utils/response');

const sendOtp = async (req, res, next) => {
  try {
    const result = await authService.sendOtp(req.body);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body);
    return success(res, result, 'OTP verified successfully');
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.user.id, req.body);
    return success(res, { user }, 'Registration completed');
  } catch (err) {
    next(err);
  }
};

const loginEmail = async (req, res, next) => {
  try {
    const result = await authService.loginWithEmail(req.body);
    return success(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const loginGoogle = async (req, res, next) => {
  try {
    const result = await authService.loginWithGoogle(req.body);
    return success(res, result, 'Google login successful');
  } catch (err) {
    next(err);
  }
};

const loginApple = async (req, res, next) => {
  try {
    const result = await authService.loginWithApple(req.body);
    return success(res, result, 'Apple login successful');
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body.refreshToken, req.body.deviceId);
    return success(res, result, 'Token refreshed');
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const result = await authService.logout(req.user.id, req.body.deviceId);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

const sendDeleteAccountOtp = async (req, res, next) => {
  try {
    const result = await authService.sendDeleteAccountOtp(req.user.id);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const result = await authService.deleteAccount(req.user.id, req.body.otp);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

const setPassword = async (req, res, next) => {
  try {
    const user = await authService.setPassword(req.user.id, req.body.password);
    return success(res, { user }, 'Password updated');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  register,
  loginEmail,
  loginGoogle,
  loginApple,
  refreshToken,
  logout,
  sendDeleteAccountOtp,
  deleteAccount,
  setPassword,
};
