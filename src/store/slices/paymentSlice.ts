import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface WorkerPayment {
  _id: string;
  workerId: string;
  paymentDate: string;
  paymentMonth: string;
  basicWage: number;
  bonusAmount: number;
  deductions: number;
  totalAmount: number;
  paymentMode: 'Cash' | 'Check' | 'BankTransfer';
  paymentStatus: 'Pending' | 'Paid' | 'Cancelled';
  receiptNumber?: string;
  notes?: string;
  processedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface MonthlySummary {
  totalPayments: number;
  totalAmount: number;
  totalBasicWage: number;
  totalBonus: number;
  totalDeductions: number;
  averagePayment: number;
}

interface PaymentState {
  payments: WorkerPayment[];
  pendingPayments: WorkerPayment[];
  summary: MonthlySummary | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const initialState: PaymentState = {
  payments: [],
  pendingPayments: [],
  summary: null,
  loading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 20, pages: 0 }
};

// Thunks
export const createPayment = createAsyncThunk(
  'payment/createPayment',
  async (
    data: {
      workerId: string;
      paymentMonth: string;
      basicWage: number;
      bonusAmount?: number;
      deductions?: number;
      paymentMode?: string;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/workers/payments', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to create payment');
    }
  }
);

export const processPayment = createAsyncThunk(
  'payment/processPayment',
  async ({ id, receiptNumber }: { id: string; receiptNumber?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/workers/payments/${id}/process`, { receiptNumber });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to process payment');
    }
  }
);

export const cancelPayment = createAsyncThunk(
  'payment/cancelPayment',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/workers/payments/${id}/cancel`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to cancel payment');
    }
  }
);

export const getWorkerPayments = createAsyncThunk(
  'payment/getWorkerPayments',
  async (
    { workerId, startDate, endDate, page, limit }: { workerId: string; startDate?: string; endDate?: string; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(`/workers/payments/worker/${workerId}`, {
        params: { startDate, endDate, page, limit }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch worker payments');
    }
  }
);

export const getPendingPayments = createAsyncThunk(
  'payment/getPendingPayments',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/workers/payments/pending', { params });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch pending payments');
    }
  }
);

export const getMonthlySummary = createAsyncThunk(
  'payment/getMonthlySummary',
  async (paymentMonth: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/workers/payments/summary/${paymentMonth}`);
      return response.data.data.summary;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch monthly summary');
    }
  }
);

export const getAllPayments = createAsyncThunk(
  'payment/getAllPayments',
  async (
    params: {
      workerId?: string;
      paymentStatus?: string;
      paymentMonth?: string;
      page?: number;
      limit?: number;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get('/workers/payments', { params });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch payments');
    }
  }
);

export const generatePayroll = createAsyncThunk(
  'payment/generatePayroll',
  async (paymentMonth: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/workers/payments/generate/${paymentMonth}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to generate payroll');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSummary: (state) => {
      state.summary = null;
    }
  },
  extraReducers: (builder) => {
    // Create payment
    builder.addCase(createPayment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createPayment.fulfilled, (state, action: PayloadAction<WorkerPayment>) => {
      state.loading = false;
      state.payments.push(action.payload);
    });
    builder.addCase(createPayment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Process payment
    builder.addCase(processPayment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(processPayment.fulfilled, (state, action: PayloadAction<WorkerPayment>) => {
      state.loading = false;
      const index = state.payments.findIndex((p) => p._id === action.payload._id);
      if (index !== -1) {
        state.payments[index] = action.payload;
      }
    });
    builder.addCase(processPayment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Cancel payment
    builder.addCase(cancelPayment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(cancelPayment.fulfilled, (state, action: PayloadAction<WorkerPayment>) => {
      state.loading = false;
      const index = state.payments.findIndex((p) => p._id === action.payload._id);
      if (index !== -1) {
        state.payments[index] = action.payload;
      }
    });
    builder.addCase(cancelPayment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get worker payments
    builder.addCase(getWorkerPayments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getWorkerPayments.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.payments = action.payload.payments;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(getWorkerPayments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get pending payments
    builder.addCase(getPendingPayments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getPendingPayments.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.pendingPayments = action.payload.payments;
    });
    builder.addCase(getPendingPayments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get monthly summary
    builder.addCase(getMonthlySummary.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getMonthlySummary.fulfilled, (state, action: PayloadAction<MonthlySummary>) => {
      state.loading = false;
      state.summary = action.payload;
    });
    builder.addCase(getMonthlySummary.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get all payments
    builder.addCase(getAllPayments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getAllPayments.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.payments = action.payload.payments;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(getAllPayments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Generate payroll
    builder.addCase(generatePayroll.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(generatePayroll.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(generatePayroll.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const { clearError, clearSummary } = paymentSlice.actions;
export default paymentSlice.reducer;
