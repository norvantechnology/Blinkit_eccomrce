const bcrypt = require('bcryptjs');
const adminRepository = require('./admin-users.repository');
const tokenService = require('../auth/token.service');
const rbacService = require('../../services/rbac.service');
const emailProvider = require('../../integrations/email-provider');
const { AppError } = require('../../utils/errors');

const formatAdminProfile = (admin, permissions) => ({
  id: admin.id,
  name: admin.name,
  email: admin.email,
  role: admin.role.name,
  roleId: admin.roleId,
  storeId: admin.storeId,
  permissions,
  isActive: admin.isActive,
});

const login = async ({ email, password }) => {
  const admin = await adminRepository.findAdminByEmail(email);

  if (!admin || !admin.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  const permissions = await rbacService.getRolePermissions(admin.roleId);
  const tokens = await tokenService.issueAdminTokens(
    { ...admin, roleName: admin.role.name },
    permissions,
  );

  return {
    user: formatAdminProfile(admin, permissions),
    tokens,
  };
};

const refreshToken = async (refreshToken) => {
  const payload = await tokenService.rotateRefreshToken(refreshToken);

  if (payload.aud !== 'admin') {
    throw new AppError('Invalid refresh token', 401);
  }

  const admin = await adminRepository.findAdminById(payload.sub);
  if (!admin) {
    throw new AppError('Admin not found or inactive', 401);
  }

  const permissions = await rbacService.getRolePermissions(admin.roleId);
  const tokens = await tokenService.issueAdminTokens(
    { ...admin, roleName: admin.role.name },
    permissions,
  );

  return {
    tokens,
    user: formatAdminProfile(admin, permissions),
  };
};

const logout = async (adminId) => {
  await tokenService.revokeAdminRefreshToken(adminId);
  return { message: 'Logged out successfully' };
};

const listPermissions = () => adminRepository.listPermissions();

const FORGOT_PASSWORD_MESSAGE =
  'If an account with that email exists, a password reset link has been sent.';

const forgotPassword = async ({ email }) => {
  const admin = await adminRepository.findAdminByEmail(email);

  if (admin && admin.isActive) {
    const resetToken = await tokenService.issueAdminPasswordResetToken(admin.id);
    await emailProvider.sendPasswordResetEmail(admin.email, resetToken);

    // Dev DX: return reset URL so admin panel can show it without digging logs
    if (process.env.NODE_ENV !== 'production') {
      const adminPanelUrl = process.env.ADMIN_PANEL_URL || 'http://localhost:3000';
      return {
        message: FORGOT_PASSWORD_MESSAGE,
        resetUrl: `${adminPanelUrl}/forgot-password?token=${resetToken}`,
      };
    }
  }

  return { message: FORGOT_PASSWORD_MESSAGE };
};

const resetPassword = async ({ token, password }) => {
  const adminId = await tokenService.verifyAdminPasswordResetToken(token);
  const admin = await adminRepository.findAdminById(adminId);

  if (!admin) {
    throw new AppError('Admin account not found', 404);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await adminRepository.updatePassword(adminId, passwordHash);
  await tokenService.revokeAdminRefreshToken(adminId);

  return { message: 'Password reset successfully. Please log in with your new password.' };
};

module.exports = {
  login,
  refreshToken,
  logout,
  listPermissions,
  forgotPassword,
  resetPassword,
  formatAdminProfile,
};
