/**
 * SMS provider integration stub.
 * In dev: logs OTP to console instead of sending via AWS SNS.
 */
const aws = require('../../config/aws');
const logger = require('../../utils/logger');

const sendOtp = async (phone, otp) => {
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[DEV OTP] phone=${phone} otp=${otp}`);
    return { success: true, provider: 'console' };
  }

  return aws.sns.publishSMS({
    phone,
    message: `Your Tapi Grocery verification code is: ${otp}. Valid for 5 minutes.`,
  });
};

module.exports = { sendOtp };
