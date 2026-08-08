const adminService = require('./admin-users.service');
const { success } = require('../../utils/response');

const login = async (req, res, next) => {
  try {
    const result = await adminService.login(req.body);
    return success(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const result = await adminService.refreshToken(req.body.refreshToken);
    return success(res, result, 'Token refreshed');
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const result = await adminService.logout(req.admin.id);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

const listPermissions = async (_req, res, next) => {
  try {
    const permissions = await adminService.listPermissions();
    return success(res, { permissions });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await adminService.forgotPassword(req.body);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await adminService.resetPassword(req.body);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  listPermissions,
  forgotPassword,
  resetPassword,
};
