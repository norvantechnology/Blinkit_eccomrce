/**
 * SMS / OTP delivery.
 * Blinkit.md §3 / §7.1 options: AWS SNS, MSG91/Twilio, or Firebase Phone Auth.
 * For now (zero bill): static OTP mode — no SMS provider charged.
 * Set OTP_SMS_PROVIDER=sns later to enable AWS SNS (paid).
 */
const aws = require('../../config/aws');
const logger = require('../../utils/logger');
const { OTP_STATIC_CODE } = require('../../config/constants');

const isStaticMode = () => {
  const provider = (process.env.OTP_SMS_PROVIDER || 'static').toLowerCase();
  // Explicit paid providers take priority; OTP_TEST_CODE forces static for local/QA.
  if (provider === 'sns' || provider === 'msg91' || provider === 'twilio') {
    return Boolean(process.env.OTP_TEST_CODE);
  }
  return provider === 'static' || provider === '' || Boolean(process.env.OTP_TEST_CODE);
};

const resolveStaticCode = () =>
  process.env.OTP_STATIC_CODE || process.env.OTP_TEST_CODE || OTP_STATIC_CODE;

const sendOtp = async (phone, otp) => {
  if (isStaticMode()) {
    logger.info(`[STATIC OTP] phone=${phone} otp=${otp} (free mode — no SMS billed)`);
    return { success: true, provider: 'static', staticOtp: true };
  }

  if ((process.env.OTP_SMS_PROVIDER || '').toLowerCase() === 'sns') {
    return aws.sns.publishSMS({
      phone,
      message: `Your Tapi Grocery verification code is: ${otp}. Valid for 5 minutes.`,
    });
  }

  // MSG91 / Twilio not wired yet — fall back to static log
  logger.info(`[OTP] provider unset — logging only phone=${phone} otp=${otp}`);
  return { success: true, provider: 'console', staticOtp: true };
};

module.exports = { sendOtp, isStaticMode, resolveStaticCode };
