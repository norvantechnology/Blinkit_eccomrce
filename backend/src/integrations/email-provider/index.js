const logger = require('../../utils/logger');
const aws = require('../../config/aws');
const env = require('../../config/env');
const smsProvider = require('../sms-provider');

/**
 * Sends admin password-reset email.
 * In dev/test: logs reset link to console (same pattern as OTP SMS stub).
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  const adminPanelUrl = env.adminPanelUrl;
  const resetUrl = `${adminPanelUrl}/forgot-password?token=${resetToken}`;

  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[DEV EMAIL] password reset to=${email} token=${resetToken} url=${resetUrl}`);
    return { success: true, provider: 'console' };
  }

  // SES not wired yet — log link so resets still work in live without SES
  if (!env.aws.sesFromEmail) {
    logger.info(`[EMAIL] SES not configured — reset link for ${email}: ${resetUrl}`);
    return { success: true, provider: 'console' };
  }

  return aws.ses.sendEmail({
    to: email,
    subject: 'Tapi Grocery Admin — Password Reset',
    body: `Reset your password using this link (valid 15 minutes): ${resetUrl}`,
  });
};

/**
 * Send login/signup OTP to email.
 * Uses the same static OTP mode as SMS when OTP_SMS_PROVIDER=static / OTP_TEST_CODE is set.
 */
const sendOtpEmail = async (email, otp) => {
  if (smsProvider.isStaticMode()) {
    logger.info(`[STATIC OTP] email=${email} otp=${otp} (free mode — no email billed)`);
    return { success: true, provider: 'static', staticOtp: true };
  }

  if (process.env.NODE_ENV !== 'production' || !env.aws.sesFromEmail) {
    logger.info(`[OTP EMAIL] to=${email} otp=${otp}`);
    return { success: true, provider: 'console', staticOtp: true };
  }

  await aws.ses.sendEmail({
    to: email,
    subject: 'Your Tapi Grocery verification code',
    body: `Your Tapi Grocery verification code is: ${otp}. Valid for 5 minutes.`,
  });
  return { success: true, provider: 'ses' };
};

module.exports = { sendPasswordResetEmail, sendOtpEmail };
