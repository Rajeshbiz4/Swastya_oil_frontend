import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API Response interface
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Booking interfaces
export interface TankerBooking {
  _id: string;
  bookingDate: string;
  tankerCapacity: number;
  rate: number;
  bookingAmount: number;
  paidAmount: number;
  pendingAmount: number;
  bookingstatus: 'Pending' | 'PartiallyPaid' | 'Completed';
  remarks?: string;
  totalValue: number;
  createdBy: {
    _id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BookingSummary {
  totalBookings: number;
  totalCapacity: number;
  totalBookingAmount: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
  averageRate: number;
  statusBreakdown: Record<string, { count: number; totalAmount: number }>;
}

// Determine base URL: use Vite env variable in production, otherwise use Vite proxy '/api'
    const baseURL =  'https://swastya-oil-backend.vercel.app/api';
//  const baseURL =  'http://localhost:5000/api';


// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    // Return structured error
    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: error.response?.data?.error?.code || 'NETWORK_ERROR',
        message: error.response?.data?.error?.message || 'Network error occurred',
        details: error.response?.data?.error?.details
      }
    };
    
    return Promise.reject(errorResponse);
  }
);

// Booking API functions
export const bookingAPI = {
  // Get all bookings with optional filters
  getAll: (params?: { startDate?: string; endDate?: string; bookingstatus?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.bookingstatus) queryParams.append('bookingstatus', params.bookingstatus);
    
    return api.get<ApiResponse<TankerBooking[]>>(`/bookings?${queryParams}`);
  },

  // Get booking by ID
  getById: (id: string) => {
    return api.get<ApiResponse<TankerBooking>>(`/bookings/${id}`);
  },

  // Create new booking
  create: (bookingData: {
    bookingDate: string;
    tankerCapacity: number;
    rate: number;
    bookingAmount: number;
    remarks?: string;
  }) => {
    return api.post<ApiResponse<TankerBooking>>('/bookings', bookingData);
  },

  // Update booking
  update: (id: string, bookingData: {
    bookingDate?: string;
    tankerCapacity?: number;
    rate?: number;
    bookingAmount?: number;
    remarks?: string;
  }) => {
    return api.put<ApiResponse<TankerBooking>>(`/bookings/${id}`, bookingData);
  },

  // Delete booking
  delete: (id: string) => {
    return api.delete<ApiResponse<{ message: string }>>(`/bookings/${id}`);
  },

  // Update booking payment
  updatePayment: (id: string, paymentAmount: number) => {
    return api.put<ApiResponse<TankerBooking>>(`/bookings/${id}/payment`, { paymentAmount });
  },

  // Get booking summary
  getSummary: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    return api.get<ApiResponse<BookingSummary>>(`/bookings/summary?${queryParams}`);
  }
};

// Oil Purchase interfaces
export interface OilPurchase {
  _id: string;
  supplierName: string;
  quantity: number;
  ratePerLiter: number;
  totalAmount: number;
  paymentMode: 'Cash' | 'Credit';
  invoiceNumber: string;
  invoiceDate: string;
  deliveryDate: string;
  isPaid: boolean;
  createdBy: {
    _id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Packaging Purchase interfaces
export interface PackagingPurchase {
  _id: string;
  supplierName: string;
  skuSize: '500g' | '1L' | '5L' | '10L' | '15L';
  packagingType: 'Can' | 'Bag';
  quantity: number;
  ratePerUnit: number;
  totalAmount: number;
  paymentMode: 'Cash' | 'Credit';
  invoiceNumber: string;
  invoiceDate: string;
  deliveryDate: string;
  isPaid: boolean;
  createdBy: {
    _id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Purchase Summary interfaces
export interface PurchaseSummary {
  totalPurchases: number;
  totalQuantity: number;
  totalAmount: number;
  averageRate: number;
  cashPurchases: number;
  creditPurchases: number;
  paidAmount: number;
  unpaidAmount: number;
}

export interface PackagingPurchaseSummary extends PurchaseSummary {
  breakdown: Array<{
    _id: { skuSize: string; packagingType: string };
    totalQuantity: number;
    totalAmount: number;
    averageRate: number;
    purchaseCount: number;
  }>;
}

// Oil Purchase API functions
export const oilPurchaseAPI = {
  // Get all oil purchases with optional filters
  getAll: (params?: { 
    page?: number;
    limit?: number;
    supplierName?: string;
    paymentMode?: string;
    isPaid?: boolean;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.supplierName) queryParams.append('supplierName', params.supplierName);
    if (params?.paymentMode) queryParams.append('paymentMode', params.paymentMode);
    if (params?.isPaid !== undefined) queryParams.append('isPaid', params.isPaid.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    return api.get<ApiResponse<{ purchases: OilPurchase[]; pagination: any }>>(`/procurement/oil-purchases?${queryParams}`);
  },

  // Get oil purchase by ID
  getById: (id: string) => {
    return api.get<ApiResponse<{ purchase: OilPurchase; rawOilInventory?: any }>>(`/procurement/oil-purchases/${id}`);
  },

  // Create new oil purchase
  create: (purchaseData: {
    supplierName: string;
    quantity: number;
    ratePerLiter: number;
    paymentMode: string;
    invoiceNumber: string;
    invoiceDate: string;
    deliveryDate: string;
  }) => {
    return api.post<ApiResponse<{ oilPurchase: OilPurchase; rawOilInventory: any }>>('/procurement/oil-purchases', purchaseData);
  },

  // Update payment status
  updatePaymentStatus: (id: string, isPaid: boolean) => {
    return api.put<ApiResponse<{ purchase: OilPurchase }>>(`/procurement/oil-purchases/${id}/payment`, { isPaid });
  },

  // Get oil purchase summary
  getSummary: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    return api.get<ApiResponse<{ summary: PurchaseSummary; dateRange: any }>>(`/procurement/oil-purchases/summary?${queryParams}`);
  }
};

// Packaging Purchase API functions
export const packagingPurchaseAPI = {
  // Get all packaging purchases with optional filters
  getAll: (params?: { 
    page?: number;
    limit?: number;
    supplierName?: string;
    skuSize?: string;
    packagingType?: string;
    paymentMode?: string;
    isPaid?: boolean;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.supplierName) queryParams.append('supplierName', params.supplierName);
    if (params?.skuSize) queryParams.append('skuSize', params.skuSize);
    if (params?.packagingType) queryParams.append('packagingType', params.packagingType);
    if (params?.paymentMode) queryParams.append('paymentMode', params.paymentMode);
    if (params?.isPaid !== undefined) queryParams.append('isPaid', params.isPaid.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    return api.get<ApiResponse<{ purchases: PackagingPurchase[]; pagination: any }>>(`/procurement/packaging-purchases?${queryParams}`);
  },

  // Get packaging purchase by ID
  getById: (id: string) => {
    return api.get<ApiResponse<{ purchase: PackagingPurchase; packagingInventory?: any }>>(`/procurement/packaging-purchases/${id}`);
  },

  // Create new packaging purchase
  create: (purchaseData: {
    supplierName: string;
    skuSize: string;
    packagingType: string;
    quantity: number;
    ratePerUnit: number;
    paymentMode: string;
    invoiceNumber: string;
    invoiceDate: string;
    deliveryDate: string;
  }) => {
    return api.post<ApiResponse<{ packagingPurchase: PackagingPurchase; packagingInventory: any }>>('/procurement/packaging-purchases', purchaseData);
  },

  // Update payment status
  updatePaymentStatus: (id: string, isPaid: boolean) => {
    return api.put<ApiResponse<{ purchase: PackagingPurchase }>>(`/procurement/packaging-purchases/${id}/payment`, { isPaid });
  },

  // Get packaging purchase summary
  getSummary: (params?: { startDate?: string; endDate?: string; skuSize?: string; packagingType?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.skuSize) queryParams.append('skuSize', params.skuSize);
    if (params?.packagingType) queryParams.append('packagingType', params.packagingType);
    
    return api.get<ApiResponse<{ summary: PurchaseSummary; breakdown: any; filters: any }>>(`/procurement/packaging-purchases/summary?${queryParams}`);
  }
};

export default api;