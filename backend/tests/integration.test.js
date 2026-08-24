const request = require('supertest');

const capturedResetTokens = [];

jest.mock('../src/integrations/google-auth', () => ({
  verifyGoogleIdToken: jest.fn().mockResolvedValue({
    providerId: 'google-test-uid-123',
    email: 'googleuser@test.local',
    name: 'Google Test User',
  }),
}));

jest.mock('../src/integrations/apple-auth', () => ({
  verifyAppleIdToken: jest.fn().mockResolvedValue({
    providerId: 'apple-test-uid-456',
    email: 'appleuser@test.local',
    name: 'Apple Test User',
    emailVerified: true,
  }),
}));

jest.mock('../src/integrations/email-provider', () => ({
  sendPasswordResetEmail: jest.fn().mockImplementation(async (email, token) => {
    capturedResetTokens.push({ email, token });
    return { success: true, provider: 'mock' };
  }),
  sendOtpEmail: jest.fn().mockImplementation(async (email, otp) => {
    return { success: true, provider: 'static', staticOtp: true, otp };
  }),
}));

const app = require('../src/app');

const TEST_PHONE = '+919999999999';
const TEST_OTP = process.env.OTP_TEST_CODE || '123456';
const GOOGLE_TEST_EMAIL = 'googleuser@test.local';
const APPLE_TEST_EMAIL = 'appleuser@test.local';

describe('Auth OTP flow', () => {
  it('POST /auth/otp/send → verify → returns tokens and user profile', async () => {
    const sendRes = await request(app)
      .post('/api/v1/auth/otp/send')
      .send({ phone: TEST_PHONE });

    expect(sendRes.status).toBe(200);
    expect(sendRes.body.success).toBe(true);

    const verifyRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: TEST_PHONE, otp: TEST_OTP, deviceId: 'test-device' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.tokens.accessToken).toBeDefined();
    expect(verifyRes.body.data.tokens.refreshToken).toBeDefined();
    expect(verifyRes.body.data.user.phone).toBe(TEST_PHONE);
  });

  it('POST /auth/refresh-token rotates tokens', async () => {
    await request(app).post('/api/v1/auth/otp/send').send({ phone: TEST_PHONE });

    const verifyRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: TEST_PHONE, otp: TEST_OTP });

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken: verifyRes.body.data.tokens.refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.tokens.accessToken).toBeDefined();
    expect(refreshRes.body.data.tokens.refreshToken).not.toBe(
      verifyRes.body.data.tokens.refreshToken,
    );
  });
});

describe('Google OAuth flow', () => {
  it('POST /auth/oauth/google → find-or-create user → returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/oauth/google')
      .send({ idToken: 'fake-google-id-token', deviceId: 'google-device' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(GOOGLE_TEST_EMAIL);
    expect(res.body.data.user.authProvider).toBe('google');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
  });
});

describe('Apple OAuth flow', () => {
  it('POST /auth/oauth/apple → find-or-create user → returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/oauth/apple')
      .send({
        idToken: 'fake-apple-id-token',
        email: APPLE_TEST_EMAIL,
        name: 'Apple Test User',
        deviceId: 'apple-device',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(APPLE_TEST_EMAIL);
    expect(res.body.data.user.authProvider).toBe('apple');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
  });
});

describe('Admin forgot/reset password flow', () => {
  const adminEmail = 'admin@gmail.com';
  const newPassword = 'NewAdmin@456';

  beforeEach(() => {
    capturedResetTokens.length = 0;
  });

  it('POST /admin/auth/forgot-password → reset-password → login with new password', async () => {
    const forgotRes = await request(app)
      .post('/api/v1/admin/auth/forgot-password')
      .send({ email: adminEmail });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.message).toContain('If an account');
    expect(capturedResetTokens).toHaveLength(1);
    expect(capturedResetTokens[0].email).toBe(adminEmail);

    const resetRes = await request(app)
      .post('/api/v1/admin/auth/reset-password')
      .send({ token: capturedResetTokens[0].token, password: newPassword });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    const loginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: adminEmail, password: newPassword });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.tokens.accessToken).toBeDefined();

    // Restore original password for other tests
    const forgotAgain = await request(app)
      .post('/api/v1/admin/auth/forgot-password')
      .send({ email: adminEmail });

    expect(forgotAgain.status).toBe(200);
    const restoreRes = await request(app)
      .post('/api/v1/admin/auth/reset-password')
      .send({ token: capturedResetTokens[capturedResetTokens.length - 1].token, password: 'admin@123' });

    expect(restoreRes.status).toBe(200);
  });
});

describe('RBAC authorization', () => {
  const loginAdmin = async (email, password) => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email, password });
    return res.body.data.tokens.accessToken;
  };

  it('super_admin can access GET /admin/permissions', async () => {
    const token = await loginAdmin('admin@gmail.com', 'admin@123');

    const res = await request(app)
      .get('/api/v1/admin/permissions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.permissions).toBeInstanceOf(Array);
    expect(res.body.data.permissions.length).toBeGreaterThan(0);
  });

  it('support_agent is denied GET /admin/permissions (403)', async () => {
    const token = await loginAdmin('support@test.local', 'Support@123');

    const res = await request(app)
      .get('/api/v1/admin/permissions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('Auth email OTP flow', () => {
  const TEST_EMAIL = 'otp-user@test.local';

  it('POST /auth/otp/send email → verify → returns tokens and user', async () => {
    const sendRes = await request(app)
      .post('/api/v1/auth/otp/send')
      .send({ email: TEST_EMAIL });

    expect(sendRes.status).toBe(200);
    expect(sendRes.body.success).toBe(true);

    const verifyRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ email: TEST_EMAIL, otp: TEST_OTP, deviceId: 'email-device' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.tokens.accessToken).toBeDefined();
    expect(verifyRes.body.data.user.email).toBe(TEST_EMAIL);
  });
});

describe('Delete account OTP', () => {
  const DELETE_PHONE = '+919999999998';

  it('requires OTP to delete, then deletes after verify', async () => {
    await request(app).post('/api/v1/auth/otp/send').send({ phone: DELETE_PHONE });
    const verifyRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: DELETE_PHONE, otp: TEST_OTP, deviceId: 'delete-device' });
    const token = verifyRes.body.data.tokens.accessToken;

    const noOtp = await request(app)
      .delete('/api/v1/auth/account')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(noOtp.status).toBe(400);

    const sendDel = await request(app)
      .post('/api/v1/auth/account/delete-otp')
      .set('Authorization', `Bearer ${token}`);
    expect(sendDel.status).toBe(200);

    const delRes = await request(app)
      .delete('/api/v1/auth/account')
      .set('Authorization', `Bearer ${token}`)
      .send({ otp: TEST_OTP });
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });
});
