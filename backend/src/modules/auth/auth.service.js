const bcrypt = require('bcryptjs');
const authRepository = require('./auth.repository');
const tokenService = require('./token.service');
const smsProvider = require('../../integrations/sms-provider');
const googleAuth = require('../../integrations/google-auth');
const appleAuth = require('../../integrations/apple-auth');
const { AppError } = require('../../utils/errors');
const { AUTH_PROVIDER, OTP_PURPOSE } = require('../../config/constants');

const MAX_OTP_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 5;

const generateOtp = () => {
  // Free/static mode (default) — Blinkit.md allows SNS/MSG91/Firebase later
  if (smsProvider.isStaticMode()) {
    return smsProvider.resolveStaticCode();
  }
  return String(Math.floor(100000 + Math.random() * 900000));
};

const formatUserProfile = (user) => ({
  id: user.id,
  phone: user.phone,
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl ?? null,
  languagePref: user.languagePref,
  authProvider: user.authProvider,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

const issueTokensForUser = async (user, { deviceId = 'default', fcmToken, platform = 'web' } = {}) => {
  if (!user.isActive) {
    throw new AppError('Account is inactive', 403);
  }

  await authRepository.upsertUserDevice(user.id, deviceId, {
    fcmToken: fcmToken || null,
    platform,
  });

  const tokens = await tokenService.issueUserTokens(user, deviceId);
  return { user: formatUserProfile(user), tokens };
};

const sendOtp = async ({ phone }) => {
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await authRepository.createOtp({
    phone,
    otpHash,
    purpose: OTP_PURPOSE.LOGIN,
    expiresAt,
  });

  const delivery = await smsProvider.sendOtp(phone, otp);

  const payload = { message: 'If this phone number is valid, an OTP has been sent.' };
  if (delivery?.staticOtp) {
    payload.staticOtp = true;
    payload.otp = otp; // free/static mode only — never enable with paid SMS
  }
  return payload;
};

const verifyOtp = async ({ phone, otp, deviceId = 'default', fcmToken, platform = 'web' }) => {
  const record = await authRepository.findLatestOtp(phone, OTP_PURPOSE.LOGIN);

  if (!record) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError('Too many failed attempts. Please request a new OTP.', 429);
  }

  const valid = await bcrypt.compare(otp, record.otpHash);

  if (!valid) {
    await authRepository.incrementOtpAttempts(record.id, record.attempts + 1);
    throw new AppError('Invalid OTP', 400);
  }

  await authRepository.markOtpVerified(record.id);

  let user = await authRepository.findUserByPhone(phone);

  if (!user) {
    user = await authRepository.createUser({
      phone,
      authProvider: AUTH_PROVIDER.PHONE,
    });
  }

  return issueTokensForUser(user, { deviceId, fcmToken, platform });
};

const loginWithGoogle = async ({ idToken, deviceId = 'default', fcmToken, platform = 'web' }) => {
  const profile = await googleAuth.verifyGoogleIdToken(idToken);

  let user = await authRepository.findUserByProvider(AUTH_PROVIDER.GOOGLE, profile.providerId);

  if (!user && profile.email) {
    user = await authRepository.findUserByEmail(profile.email);
    if (user) {
      user = await authRepository.updateUser(user.id, {
        authProvider: AUTH_PROVIDER.GOOGLE,
        providerId: profile.providerId,
        name: user.name || profile.name,
      });
    }
  }

  if (!user) {
    user = await authRepository.createUser({
      email: profile.email,
      name: profile.name,
      authProvider: AUTH_PROVIDER.GOOGLE,
      providerId: profile.providerId,
    });
  }

  return issueTokensForUser(user, { deviceId, fcmToken, platform });
};

const loginWithApple = async ({
  idToken,
  email,
  name,
  deviceId = 'default',
  fcmToken,
  platform = 'web',
}) => {
  const profile = await appleAuth.verifyAppleIdToken(idToken, { email, name });

  let user = await authRepository.findUserByProvider(AUTH_PROVIDER.APPLE, profile.providerId);

  if (!user && profile.email) {
    user = await authRepository.findUserByEmail(profile.email);
    if (user) {
      user = await authRepository.updateUser(user.id, {
        authProvider: AUTH_PROVIDER.APPLE,
        providerId: profile.providerId,
        name: user.name || profile.name,
      });
    }
  }

  if (!user) {
    user = await authRepository.createUser({
      email: profile.email || undefined,
      name: profile.name,
      authProvider: AUTH_PROVIDER.APPLE,
      providerId: profile.providerId,
    });
  }

  return issueTokensForUser(user, { deviceId, fcmToken, platform });
};

const register = async (userId, { name, phone, email }) => {
  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updateData = { name };

  if (phone && phone !== user.phone) {
    const existing = await authRepository.findUserByPhone(phone);
    if (existing && existing.id !== userId) {
      throw new AppError('Phone number already in use', 409);
    }
    updateData.phone = phone;
  }

  if (email) {
    const existing = await authRepository.findUserByEmail(email);
    if (existing && existing.id !== userId) {
      throw new AppError('Email already in use', 409);
    }
    updateData.email = email;
  }

  const updated = await authRepository.updateUser(userId, updateData);
  return formatUserProfile(updated);
};

const loginWithEmail = async ({ email, password, deviceId = 'default', fcmToken, platform = 'web' }) => {
  const user = await authRepository.findUserByEmail(email);

  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  return issueTokensForUser(user, { deviceId, fcmToken, platform });
};

const refreshToken = async (refreshToken, deviceId = 'default') => {
  const payload = await tokenService.rotateRefreshToken(refreshToken);

  if (payload.aud !== 'user') {
    throw new AppError('Invalid refresh token', 401);
  }

  const user = await authRepository.findUserById(payload.sub);
  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 401);
  }

  const resolvedDeviceId = payload.deviceId || deviceId;
  const tokens = await tokenService.issueUserTokens(user, resolvedDeviceId);

  return { tokens, user: formatUserProfile(user) };
};

const logout = async (userId, deviceId = 'default') => {
  await tokenService.revokeUserRefreshToken(userId, deviceId);
  await authRepository.upsertUserDevice(userId, deviceId, { isRevoked: true });
  return { message: 'Logged out successfully' };
};

const deleteAccount = async (userId) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await authRepository.revokeAllUserDevices(userId);
  await tokenService.revokeAllUserRefreshTokens(userId);
  await authRepository.softDeleteUser(userId);

  return { message: 'Account deleted successfully' };
};

const setPassword = async (userId, password) => {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await authRepository.updateUser(userId, { passwordHash });
  return formatUserProfile(user);
};

module.exports = {
  sendOtp,
  verifyOtp,
  loginWithGoogle,
  loginWithApple,
  register,
  loginWithEmail,
  refreshToken,
  logout,
  deleteAccount,
  setPassword,
  formatUserProfile,
};
