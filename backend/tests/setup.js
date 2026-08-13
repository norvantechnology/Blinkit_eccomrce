require('dotenv').config();

process.env.NODE_ENV = 'test';
process.env.OTP_TEST_CODE = process.env.OTP_TEST_CODE || '123456';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

const prisma = require('../src/config/database');
const redis = require('../src/config/redis');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
  await redis.connect();

  const role = await prisma.role.findUnique({ where: { name: 'support_agent' } });
  if (role) {
    const passwordHash = await bcrypt.hash('Support@123', 12);
    await prisma.adminUser.upsert({
      where: { email: 'support@test.local' },
      update: { passwordHash, roleId: role.id, isActive: true },
      create: {
        name: 'Support Agent',
        email: 'support@test.local',
        passwordHash,
        roleId: role.id,
        isActive: true,
      },
    });
  }
});

afterAll(async () => {
  const prisma = require('../src/config/database');
  await prisma.user.deleteMany({
    where: { OR: [{ phone: '+919999999999' }, { email: 'googleuser@test.local' }, { email: 'appleuser@test.local' }] },
  });
  await prisma.otpVerification.deleteMany({
    where: { phone: '+919999999999' },
  });
  await redis.quit();
  await prisma.$disconnect();
});

afterEach(async () => {
  await redis.flushdb();
});
