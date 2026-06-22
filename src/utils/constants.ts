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

// export const PRODUCT_TYPES = [
//   { value: 'coconut-oil-500ml-bottle', label: 'Coconut Oil 500ml Packet', packagingType: 'Coconut Oil 500ml Packet', weight: 450.0, code: 'COCONUT_OIL', type: 'Polythene Bundle' },
//   { value: 'sunflower-oil-1l-can', label: 'Sunflower Oil 1L Packet', packagingType: 'Sunflower Oil 1L Packet', weight: 910.0, code: 'SUNFLOWER_OIL', type: 'Polythene Bundle' },
//   { value: 'soyabean-oil-1l-can', label: 'Soyabean Oil 1L Packet', packagingType: 'Soyabean Oil 1L Packet', weight: 910.0, code: 'SOYABEAN_OIL', type: 'Polythene Bundle' },
//   { value: 'mustard-oil-2l-drum', label: 'Mustard Oil 2L Drum', packagingType: 'Mustard Oil 2L Drum', weight: 1820.0, code: 'MUSTARD_OIL', type: '2L Drum' },
//   { value: 'groundnut-oil-500ml-bottle', label: 'Groundnut Oil 500ml Packet', packagingType: 'Groundnut Oil 500ml Packet', weight: 450.0, code: 'GROUNDNUT_OIL', type: 'Polythene Bundle' },
//   { value: 'olive-oil-1l-bottle', label: 'Olive Oil 1L Packet', packagingType: 'Olive Oil 1L Packet', weight: 910.0, code: 'OLIVE_OIL', type: 'Polythene Bundle' },
//   { value: 'soyabean-oil-5l-can', label: 'Soyabean Oil 5L Can', packagingType: 'Soyabean Oil 5L Can', weight: 4550.0, code: 'SOYABEAN_OIL', type: '5L Can' },
//   { value: 'soyabean-oil-10l-can', label: 'Soyabean Oil 10L Can', packagingType: 'Soyabean Oil 10L Can', weight: 9100.0, code: 'SOYABEAN_OIL', type: '10L Can' },
//   { value: 'soyabean-oil-12l-can', label: 'Soyabean Oil 12L Can', packagingType: 'Soyabean Oil 12L Can', weight: 10920.0, code: 'SOYABEAN_OIL', type: '12L Can' },
//   { value: 'soyabean-oil-15l-can', label: 'Soyabean Oil 15L Can', packagingType: 'Soyabean Oil 15L Can', weight: 13650.0, code: 'SOYABEAN_OIL', type: '15L Can' },
//   { value: 'palm-oil-15l-can', label: 'Palm Oil 15L Can', packagingType: 'Palm Oil 15L Can', weight: 13650.0, code: 'PALM_OIL', type: '15L Can' },
//   { value: 'palm-oil-25l-can', label: 'Palm Oil 25L Can', packagingType: 'Palm Oil 25L Can', weight: 22750.0, code: 'PALM_OIL', type: '25L Can' },
//   { value: 'palm-oil-50l-can', label: 'Palm Oil 50L Can', packagingType: 'Palm Oil 50L Can', weight: 45500.0, code: 'PALM_OIL', type: '50L Can' },

// ];

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