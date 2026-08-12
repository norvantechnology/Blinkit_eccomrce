const logger = require('../../utils/logger');
const aws = require('../../config/aws');
const env = require('../../config/env');

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

module.exports = { sendPasswordResetEmail };
