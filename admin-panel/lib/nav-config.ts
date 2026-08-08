export interface NavItem {
  label: string;
  href: string;
  /** User must have at least one of these permissions (super_admin bypasses) */
  permissions?: string[];
  children?: NavItem[];
}

/** Nav structure gated by RBAC permission keys from Blinkit.md §19 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', permissions: ['dashboard.view'] },
  {
    label: 'Users',
    href: '/users',
    permissions: ['customers.view', 'riders.view', 'staff.view', 'roles.manage'],
    children: [
      { label: 'Customers', href: '/users/customers', permissions: ['customers.view'] },
      { label: 'Delivery Partners', href: '/users/delivery-partners', permissions: ['riders.view'] },
      { label: 'Store Managers', href: '/users/store-managers', permissions: ['staff.view'] },
      { label: 'Admin Roles', href: '/users/admin-roles', permissions: ['roles.manage'] },
    ],
  },
  {
    label: 'Catalog',
    href: '/catalog',
    permissions: ['categories.manage', 'products.view', 'brands.manage', 'inventory.manage'],
    children: [
      { label: 'Categories', href: '/catalog/categories', permissions: ['categories.manage'] },
      { label: 'Sub-Categories', href: '/catalog/sub-categories', permissions: ['categories.manage'] },
      { label: 'Products', href: '/catalog/products', permissions: ['products.view'] },
      { label: 'Brands', href: '/catalog/brands', permissions: ['brands.manage'] },
      { label: 'Inventory', href: '/catalog/inventory', permissions: ['inventory.manage'] },
      { label: 'Variants', href: '/catalog/variants', permissions: ['products.manage'] },
    ],
  },
  {
    label: 'Orders',
    href: '/orders',
    permissions: ['orders.view'],
    children: [
      { label: 'All Orders', href: '/orders', permissions: ['orders.view'] },
      { label: 'Refunds', href: '/orders/refunds', permissions: ['orders.refund'] },
      { label: 'Cancellations', href: '/orders/cancellations', permissions: ['orders.view'] },
      { label: 'Returns', href: '/orders/returns', permissions: ['orders.manage'] },
      { label: 'Disputes', href: '/orders/disputes', permissions: ['orders.manage'] },
    ],
  },
  {
    label: 'Promotions',
    href: '/promotions',
    permissions: ['coupons.manage', 'banners.manage', 'deals.manage'],
    children: [
      { label: 'Coupons', href: '/promotions/coupons', permissions: ['coupons.manage'] },
      { label: 'Banners', href: '/promotions/banners', permissions: ['banners.manage'] },
      { label: 'Deals', href: '/promotions/deals', permissions: ['deals.manage'] },
    ],
  },
  {
    label: 'Payments',
    href: '/payments',
    permissions: ['payments.view', 'wallet.manage'],
    children: [
      { label: 'Reconciliation', href: '/payments/reconciliation', permissions: ['payments.view'] },
      { label: 'Refunds', href: '/payments/refunds', permissions: ['payments.refund'] },
      { label: 'Wallet', href: '/payments/wallet', permissions: ['wallet.manage'] },
    ],
  },
  {
    label: 'Reports',
    href: '/reports',
    permissions: ['reports.view'],
    children: [
      { label: 'Sales', href: '/reports/sales', permissions: ['reports.view'] },
      { label: 'Revenue', href: '/reports/revenue', permissions: ['reports.view'] },
      { label: 'Order Trends', href: '/reports/order-trends', permissions: ['reports.view'] },
      { label: 'Customer Retention', href: '/reports/customer-retention', permissions: ['reports.view'] },
      { label: 'Product Performance', href: '/reports/product-performance', permissions: ['reports.view'] },
      { label: 'Inventory', href: '/reports/inventory', permissions: ['reports.view'] },
    ],
  },
  { label: 'Support', href: '/support/tickets', permissions: ['support.manage'] },
  {
    label: 'Settings',
    href: '/settings',
    permissions: ['store.manage', 'roles.manage'],
    children: [
      { label: 'Store Details', href: '/settings/store-details', permissions: ['store.manage'] },
      { label: 'Roles & Permissions', href: '/settings/roles-permissions', permissions: ['roles.manage'] },
      { label: 'Languages', href: '/settings/languages', permissions: ['store.manage'] },
    ],
  },
  { label: 'Audit Logs', href: '/audit-logs', permissions: ['audit.view'] },
];
