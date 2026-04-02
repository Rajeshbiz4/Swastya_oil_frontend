// Frontend types for the inventory management system

export interface User {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'Admin',
  USER = 'User',
  SALES_PERSON = 'SalesPerson'
}

export enum PaymentMode {
  CASH = 'Cash',
  CHECK = 'Cheque',
  ONLINE = 'Online'
}

export enum PackagingType {
  CAN = 'Can',
  BAG = 'Bag'
}

export enum SKUSize {
  SIZE_500G = '500g',
  SIZE_1L = '1KG',
  SIZE_5L = '5KG',
  SIZE_10L = '10KG',
  SIZE_15L = '15KG'
}

export enum OrderStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  DELIVERED = 'Delivered'
}

export enum ProductionStatus {
  IN_PROGRESS = 'InProgress',
  COMPLETED = 'Completed'
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

// Navigation and routing types
export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  roles?: UserRole[];
  children?: NavItem[];
}

// Form and UI types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'date' | 'textarea' | 'tel';
  required?: boolean;
  disabled?: boolean;
  min?: string;
  step?: string;
  options?: { value: string; label: string }[];
  validation?: unknown;
}
