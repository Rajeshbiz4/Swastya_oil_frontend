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

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api', // Vite proxy will handle this
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

export default api;