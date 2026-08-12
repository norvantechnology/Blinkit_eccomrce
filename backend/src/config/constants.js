const ROLES = {
  SUPER_ADMIN: 'super_admin',
  STORE_MANAGER: 'store_manager',
  CATALOG_MANAGER: 'catalog_manager',
  ORDER_MANAGER: 'order_manager',
  SUPPORT_AGENT: 'support_agent',
};

const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_MANAGE: 'customers.manage',
  RIDERS_VIEW: 'riders.view',
  RIDERS_MANAGE: 'riders.manage',
  STAFF_VIEW: 'staff.view',
  STAFF_MANAGE: 'staff.manage',
  ROLES_MANAGE: 'roles.manage',
  CATEGORIES_MANAGE: 'categories.manage',
  BRANDS_MANAGE: 'brands.manage',
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_MANAGE: 'products.manage',
  INVENTORY_MANAGE: 'inventory.manage',
  ORDERS_VIEW: 'orders.view',
  ORDERS_MANAGE: 'orders.manage',
  ORDERS_REFUND: 'orders.refund',
  COUPONS_MANAGE: 'coupons.manage',
  BANNERS_MANAGE: 'banners.manage',
  DEALS_MANAGE: 'deals.manage',
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_REFUND: 'payments.refund',
  WALLET_MANAGE: 'wallet.manage',
  REPORTS_VIEW: 'reports.view',
  SUPPORT_MANAGE: 'support.manage',
  STORE_MANAGE: 'store.manage',
  AUDIT_VIEW: 'audit.view',
};

const AUTH_PROVIDER = {
  PHONE: 'phone',
  GOOGLE: 'google',
  APPLE: 'apple',
  FIREBASE: 'firebase',
};

const OTP_PURPOSE = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  DELETE_ACCOUNT: 'delete_account',
};

const ADDRESS_LABEL = {
  HOME: 'home',
  WORK: 'work',
  OTHER: 'other',
};

/** Non-secret app defaults (do not put secrets here) */
const JWT_EXPIRY = {
  ACCESS: '15m',
  ADMIN_ACCESS: '8h',
  REFRESH: '30d',
};

const AUDIT_RETENTION_DAYS = 5;

/** Free/static OTP for now (Blinkit.md SMS: SNS/MSG91 later). Not a production secret. */
const OTP_STATIC_CODE = '123456';

/** Secrets Manager identity (not a secret) */
const SECRETS_MANAGER = {
  SECRET_NAME: 'tapi-grocery/backend',
  REGION: 'ap-south-1',
};

module.exports = {
  ROLES,
  PERMISSIONS,
  AUTH_PROVIDER,
  OTP_PURPOSE,
  ADDRESS_LABEL,
  JWT_EXPIRY,
  AUDIT_RETENTION_DAYS,
  OTP_STATIC_CODE,
  SECRETS_MANAGER,
};
