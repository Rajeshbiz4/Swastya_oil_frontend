import { UserRole, SKUSize, PackagingType, PaymentMode } from '../types';

// Application constants
export const APP_NAME = 'Swashtya shakti gold pvt ltd';
export const APP_VERSION = '1.0.0';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  PROCUREMENT: {
    OIL_PURCHASES: '/procurement/oil-purchases',
    PACKAGING_PURCHASES: '/procurement/packaging-purchases',
  },
  INVENTORY: {
    RAW_OIL: '/inventory/raw-oil',
    PACKAGING: '/inventory/packaging',
    FINISHED_GOODS: '/inventory/finished-goods',
    TRANSACTIONS: '/inventory/transactions',
  },
  PRODUCTION: {
    BATCHES: '/production/batches',
    WORKERS: '/workers',
  },
  SALES: {
    DISTRIBUTORS: '/sales/distributors',
    ORDERS: '/sales/orders',
  },
  REPORTS: {
    DAILY: '/reports/daily',
    MONTHLY: '/reports/monthly',
    EXPORT: '/reports/export',
  },
};

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: ['dashboard', 'booking', 'procurement', 'reports', 'users'], // Admin permissions
  [UserRole.USER]: ['inventory', 'production', 'sales', 'workers', 'attendance', 'payroll'], // User permissions
  [UserRole.SALES_PERSON]: ['sales'], // SalesPerson permissions
};

// Business constants
export const BUSINESS_CONSTANTS = {
  TANKER_QUANTITY_RANGE: {
    MIN: 10000,
    MAX: 20000,
  },
  SKU_SIZES: Object.values(SKUSize),
  PACKAGING_TYPES: Object.values(PackagingType),
  PAYMENT_MODES: Object.values(PaymentMode),
};

// UI constants
export const UI_CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  },
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  CURRENCY_FORMAT: 'en-IN',
  CURRENCY_CODE: 'INR',
};