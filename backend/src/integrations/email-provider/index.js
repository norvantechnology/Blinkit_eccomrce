const logger = require('../../utils/logger');
const aws = require('../../config/aws');
const env = require('../../config/env');

/**
 * Sends admin password-reset email.
 * In dev/test: logs reset link to console (same pattern as OTP SMS stub).
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  const adminPanelUrl = process.env.ADMIN_PANEL_URL || 'http://localhost:3000';
  const resetUrl = `${adminPanelUrl}/forgot-password?token=${resetToken}`;

  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[DEV EMAIL] password reset to=${email} token=${resetToken} url=${resetUrl}`);
    return { success: true, provider: 'console' };
  }

  if (!env.aws.sesFromEmail) {
    throw new Error('SES_FROM_EMAIL not configured for production email delivery');
  }

  return aws.ses.sendEmail({
    to: email,
    subject: 'Tapi Grocery Admin — Password Reset',
    body: `Reset your password using this link (valid 15 minutes): ${resetUrl}`,
  });
};

module.exports = { sendPasswordResetEmail };
