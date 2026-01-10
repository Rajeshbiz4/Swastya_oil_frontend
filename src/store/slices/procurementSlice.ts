import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { ApiResponse } from '../../types';

interface ProcurementSummary {
  totalPurchases: number;
  totalQuantity: number;
  totalAmount: number;
  averageRate: number;
  cashPurchases: number;
  creditPurchases: number;
  paidAmount: number;
  unpaidAmount: number;
}

interface PackagingSummary {
  totalPurchases: number;
  totalQuantity: number;
  totalAmount: number;
  averageRate: number;
  cashPurchases: number;
  creditPurchases: number;
  paidAmount: number;
  unpaidAmount: number;
}

interface ProcurementState {
  oilSummary: ProcurementSummary | null;
  packagingSummary: PackagingSummary | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProcurementState = {
  oilSummary: null,
  packagingSummary: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchOilPurchaseSummary = createAsyncThunk<ProcurementSummary>(
  'procurement/fetchOilSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<{ summary: ProcurementSummary }>>('/procurement/oil-purchases/summary');
      if (response.data.success && response.data.data) {
        return response.data.data.summary;
      }
      throw new Error('Failed to fetch oil purchase summary');
    } catch (error: any) {
      return rejectWithValue(error.error?.message || 'Failed to fetch oil purchase summary');
    }
  }
);

export const fetchPackagingPurchaseSummary = createAsyncThunk<PackagingSummary>(
  'procurement/fetchPackagingSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<{ summary: PackagingSummary }>>('/procurement/packaging-purchases/summary');
      if (response.data.success && response.data.data) {
        return response.data.data.summary;
      }
      throw new Error('Failed to fetch packaging purchase summary');
    } catch (error: any) {
      return rejectWithValue(error.error?.message || 'Failed to fetch packaging purchase summary');
    }
  }
);

const procurementSlice = createSlice({
  name: 'procurement',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Oil Purchase Summary
      .addCase(fetchOilPurchaseSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOilPurchaseSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.oilSummary = action.payload;
      })
      .addCase(fetchOilPurchaseSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Packaging Purchase Summary
      .addCase(fetchPackagingPurchaseSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPackagingPurchaseSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.packagingSummary = action.payload;
      })
      .addCase(fetchPackagingPurchaseSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = procurementSlice.actions;
export default procurementSlice.reducer;