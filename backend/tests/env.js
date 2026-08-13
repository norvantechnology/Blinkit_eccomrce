require('dotenv').config();

process.env.NODE_ENV = 'test';
process.env.OTP_TEST_CODE = process.env.OTP_TEST_CODE || '123456';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';
process.env.APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || 'com.tapigrocery.web.test';

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
