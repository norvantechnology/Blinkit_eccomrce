require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const ALL_PERMISSIONS = [
  { key: 'dashboard.view', description: 'View admin dashboard' },
  { key: 'customers.view', description: 'View customers' },
  { key: 'customers.manage', description: 'Manage customers (block/unblock)' },
  { key: 'riders.view', description: 'View delivery partners' },
  { key: 'riders.manage', description: 'Manage delivery partners' },
  { key: 'staff.view', description: 'View staff members' },
  { key: 'staff.manage', description: 'Manage staff members' },
  { key: 'roles.manage', description: 'Manage roles and permissions' },
  { key: 'categories.manage', description: 'Manage categories' },
  { key: 'brands.manage', description: 'Manage brands' },
  { key: 'products.view', description: 'View products' },
  { key: 'products.manage', description: 'Manage products' },
  { key: 'inventory.manage', description: 'Manage inventory' },
  { key: 'orders.view', description: 'View orders' },
  { key: 'orders.manage', description: 'Manage orders' },
  { key: 'orders.refund', description: 'Process order refunds' },
  { key: 'coupons.manage', description: 'Manage coupons' },
  { key: 'banners.manage', description: 'Manage banners' },
  { key: 'deals.manage', description: 'Manage flash deals' },
  { key: 'payments.view', description: 'View payments' },
  { key: 'payments.refund', description: 'Process payment refunds' },
  { key: 'wallet.manage', description: 'Manage user wallets' },
  { key: 'reports.view', description: 'View reports and analytics' },
  { key: 'support.manage', description: 'Manage support tickets' },
  { key: 'store.manage', description: 'Manage store settings' },
  { key: 'audit.view', description: 'View audit logs' },
];

const ROLES = [
  {
    name: 'super_admin',
    description: 'Full system access across all stores',
    permissions: ALL_PERMISSIONS.map((p) => p.key),
  },
  {
    name: 'store_manager',
    description: 'Manage store operations, staff, and settings',
    permissions: [
      'dashboard.view', 'customers.view', 'customers.manage',
      'riders.view', 'riders.manage', 'staff.view', 'staff.manage',
      'orders.view', 'orders.manage', 'orders.refund',
      'payments.view', 'payments.refund', 'wallet.manage',
      'reports.view', 'support.manage', 'store.manage', 'audit.view',
    ],
  },
  {
    name: 'catalog_manager',
    description: 'Manage product catalog and inventory',
    permissions: [
      'dashboard.view', 'categories.manage', 'brands.manage',
      'products.view', 'products.manage', 'inventory.manage',
    ],
  },
  {
    name: 'order_manager',
    description: 'Manage orders, refunds, and delivery',
    permissions: [
      'dashboard.view', 'orders.view', 'orders.manage', 'orders.refund',
      'riders.view', 'payments.view',
    ],
  },
  {
    name: 'support_agent',
    description: 'Handle customer support tickets',
    permissions: [
      'dashboard.view', 'customers.view', 'orders.view', 'support.manage',
    ],
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  const newStoreId = process.env.DEFAULT_STORE_ID || uuidv4();

  // Default store (Bangalore coordinates)
  await prisma.$executeRaw`
    INSERT INTO stores (
      id, name, slug, address, location,
      contact_phone, contact_email, delivery_radius_km, min_order_value,
      is_active, timezone, currency, created_at, updated_at
    ) VALUES (
      ${newStoreId}::uuid,
      'Tapi Grocery',
      'blinkit-store',
      'Koramangala, Bangalore, Karnataka 560034',
      ST_SetSRID(ST_MakePoint(77.6245, 12.9352), 4326)::geography,
      '+919876543210',
      'store@tapigrocery.local',
      5.00,
      99.00,
      true,
      'Asia/Kolkata',
      'INR',
      NOW(),
      NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      contact_email = EXCLUDED.contact_email,
      updated_at = NOW()
  `;

  const store = await prisma.store.findUnique({ where: { slug: 'blinkit-store' } });
  const storeId = store.id;

  console.log(`  ✓ Store ready — Tapi Grocery (id: ${storeId})`);

  // Default store settings
  const defaultSettings = [
    { key: 'delivery_fee', value: '25' },
    { key: 'platform_fee', value: '5' },
    { key: 'handling_fee', value: '2' },
    { key: 'tax_percent', value: '5' },
    { key: 'store_open_time', value: '06:00' },
    { key: 'store_close_time', value: '23:00' },
  ];

  for (const setting of defaultSettings) {
    await prisma.storeSetting.upsert({
      where: { storeId_key: { storeId, key: setting.key } },
      update: { value: setting.value },
      create: { storeId, key: setting.key, value: setting.value },
    });
  }

  console.log('  ✓ Store settings created');

  try {
    const fs = require('fs');
    const path = require('path');
    const privacyFile = path.join(__dirname, '../../../content/account-privacy-policy.default.md');
    const privacyMd = fs.existsSync(privacyFile)
      ? fs.readFileSync(privacyFile, 'utf8').trim()
      : 'We are committed to protecting the privacy and security of your personal information.';
    await prisma.storeSetting.upsert({
      where: { storeId_key: { storeId, key: 'account_privacy_policy_md_en' } },
      update: {},
      create: { storeId, key: 'account_privacy_policy_md_en', value: privacyMd },
    });
    console.log('  ✓ Account privacy policy seeded (EN markdown)');
  } catch (err) {
    console.warn('  ⚠ Privacy policy seed skipped:', err.message);
  }

  // Permissions
  const permissionMap = {};
  for (const perm of ALL_PERMISSIONS) {
    const created = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description },
      create: perm,
    });
    permissionMap[perm.key] = created.id;
  }

  console.log(`  ✓ ${ALL_PERMISSIONS.length} permissions created`);

  // Roles + role_permissions
  let superAdminRoleId;
  for (const roleDef of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { description: roleDef.description },
      create: { name: roleDef.name, description: roleDef.description },
    });

    if (roleDef.name === 'super_admin') {
      superAdminRoleId = role.id;
    }

    for (const permKey of roleDef.permissions) {
      const permissionId = permissionMap[permKey];
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId },
        },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  console.log(`  ✓ ${ROLES.length} roles created with permissions`);

  // Super admin user
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@gmail.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin@123';
  const superAdminName = process.env.SUPER_ADMIN_NAME || 'Super Admin';
  const passwordHash = await bcrypt.hash(superAdminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: superAdminEmail },
    update: {
      name: superAdminName,
      passwordHash,
      roleId: superAdminRoleId,
      isActive: true,
    },
    create: {
      name: superAdminName,
      email: superAdminEmail,
      passwordHash,
      roleId: superAdminRoleId,
      storeId: null, // super_admin has no store scope
      isActive: true,
    },
  });

  console.log(`  ✓ Super admin created (${superAdminEmail})`);

  // Remove legacy default admin if email was changed
  if (superAdminEmail !== 'admin@blinkit.local') {
    await prisma.adminUser.deleteMany({ where: { email: 'admin@blinkit.local' } });
  }

  // Sample staff admins (roles from §7.2 / seed ROLES)
  const supportRole = await prisma.role.findUnique({ where: { name: 'support_agent' } });
  const storeMgrRole = await prisma.role.findUnique({ where: { name: 'store_manager' } });

  if (supportRole) {
    const supportHash = await bcrypt.hash('Support@123', 12);
    await prisma.adminUser.upsert({
      where: { email: 'support@test.local' },
      update: { passwordHash: supportHash, roleId: supportRole.id, isActive: true, storeId },
      create: {
        name: 'Support Agent',
        email: 'support@test.local',
        passwordHash: supportHash,
        roleId: supportRole.id,
        storeId,
        isActive: true,
      },
    });
    console.log('  ✓ Support agent created (support@test.local / Support@123)');
  }

  if (storeMgrRole) {
    const mgrHash = await bcrypt.hash('Manager@123', 12);
    await prisma.adminUser.upsert({
      where: { email: 'manager@blinkit.local' },
      update: { passwordHash: mgrHash, roleId: storeMgrRole.id, isActive: true, storeId },
      create: {
        name: 'Store Manager',
        email: 'manager@blinkit.local',
        passwordHash: mgrHash,
        roleId: storeMgrRole.id,
        storeId,
        isActive: true,
      },
    });
    console.log('  ✓ Store manager created (manager@blinkit.local / Manager@123)');
  }

  // Sample customers (§16.1 / §19.2 — for M1 profile/address + email login testing)
  const customerPasswordHash = await bcrypt.hash('Customer@123', 12);
  const sampleCustomers = [
    { phone: '+919876543210', name: 'Rahul Sharma', email: 'rahul@example.com', languagePref: 'en' },
    { phone: '+919876543211', name: 'Priya Patel', email: 'priya@example.com', languagePref: 'hi' },
    { phone: '+919876543212', name: 'Amit Kumar', email: null, languagePref: 'en' },
  ];

  for (const customer of sampleCustomers) {
    const existing = await prisma.user.findFirst({ where: { phone: customer.phone } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: customer.name,
          email: customer.email,
          languagePref: customer.languagePref,
          passwordHash: customer.email ? customerPasswordHash : existing.passwordHash,
          isActive: true,
          deletedAt: null,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          phone: customer.phone,
          name: customer.name,
          email: customer.email,
          languagePref: customer.languagePref,
          passwordHash: customer.email ? customerPasswordHash : undefined,
          authProvider: 'phone',
          isActive: true,
        },
      });
    }
  }
  console.log(`  ✓ ${sampleCustomers.length} sample customers seeded (email login: Customer@123)`);

  // Apply PostGIS GIST indexes (idempotent)
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis');
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS idx_stores_location_gist ON stores USING GIST (location)',
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS idx_addresses_location_gist ON addresses USING GIST (location)',
    );
    console.log('  ✓ PostGIS GIST indexes ensured');
  } catch (err) {
    console.warn('  ⚠ GIST index apply skipped:', err.message);
  }

  console.log('');
  console.log('⚠️  Set DEFAULT_STORE_ID in .env to:', storeId);
  console.log('🌱 Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
