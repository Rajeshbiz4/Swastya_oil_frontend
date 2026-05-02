import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { ApiResponse } from '../../types';

export interface AuditLog {
  _id: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  description: string;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditState {
  recentLogs: AuditLog[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AuditState = {
  recentLogs: [],
  isLoading: false,
  error: null,
};

// Async thunk to fetch recent activity
export const fetchRecentActivity = createAsyncThunk<AuditLog[]>(
  'audit/fetchRecentActivity',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<{ logs: AuditLog[] }>>(
        '/audit?limit=10&page=1&sortBy=timestamp&sortOrder=desc'
      );
      if (response.data.success && response.data.data?.logs) {
        return response.data.data.logs;
      }
      throw new Error('Failed to fetch recent activity');
    } catch (error: any) {
      return rejectWithValue(
        error.error?.message || 'Failed to fetch recent activity'
      );
    }
  }
);

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentActivity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recentLogs = action.payload;
      })
      .addCase(fetchRecentActivity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = auditSlice.actions;
export default auditSlice.reducer;
