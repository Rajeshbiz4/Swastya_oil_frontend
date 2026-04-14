import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface Leave {
  _id: string;
  employeeId: string;
  workerId: string;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Paid Leave' | 'Unpaid Leave';
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface LeaveSummary {
  totalLeaves: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  cancelledLeaves: number;
  totalLeaveDays: number;
}

interface LeaveState {
  leaves: Leave[];
  summary: LeaveSummary | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const initialState: LeaveState = {
  leaves: [],
  summary: null,
  loading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 20, pages: 0 }
};

// Thunks
export const applyLeave = createAsyncThunk(
  'leave/applyLeave',
  async (
    data: {
      workerId: string;
      leaveType: 'Casual Leave' | 'Sick Leave' | 'Paid Leave' | 'Unpaid Leave';
      fromDate: string;
      toDate: string;
      reason: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/leaves/apply', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to apply for leave');
    }
  }
);

export const getEmployeeLeaves = createAsyncThunk(
  'leave/getEmployeeLeaves',
  async (
    { employeeId, status }: { employeeId: string; status?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(`/leaves/employee/${employeeId}`, {
        params: { status }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch employee leaves');
    }
  }
);

export const getPendingLeaves = createAsyncThunk(
  'leave/getPendingLeaves',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/leaves/pending');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch pending leaves');
    }
  }
);

export const approveLeave = createAsyncThunk(
  'leave/approveLeave',
  async (
    { id, approvedById }: { id: string; approvedById: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/leaves/${id}/approve`, { approvedById });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to approve leave');
    }
  }
);

export const rejectLeave = createAsyncThunk(
  'leave/rejectLeave',
  async (
    { id, rejectionReason }: { id: string; rejectionReason: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/leaves/${id}/reject`, { rejectionReason });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to reject leave');
    }
  }
);

export const cancelLeave = createAsyncThunk(
  'leave/cancelLeave',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.put(`/leaves/${id}/cancel`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to cancel leave');
    }
  }
);

export const getLeaveSummary = createAsyncThunk(
  'leave/getLeaveSummary',
  async (employeeId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/leaves/summary/${employeeId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch leave summary');
    }
  }
);

const leaveSlice = createSlice({
  name: 'leave',
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
    builder
      // Apply leave
      .addCase(applyLeave.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyLeave.fulfilled, (state, action: PayloadAction<Leave>) => {
        state.loading = false;
        state.leaves.unshift(action.payload);
      })
      .addCase(applyLeave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get employee leaves
      .addCase(getEmployeeLeaves.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEmployeeLeaves.fulfilled, (state, action: PayloadAction<Leave[]>) => {
        state.loading = false;
        state.leaves = action.payload;
      })
      .addCase(getEmployeeLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get pending leaves
      .addCase(getPendingLeaves.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPendingLeaves.fulfilled, (state, action: PayloadAction<Leave[]>) => {
        state.loading = false;
        state.leaves = action.payload;
      })
      .addCase(getPendingLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Approve leave
      .addCase(approveLeave.fulfilled, (state, action: PayloadAction<Leave>) => {
        const index = state.leaves.findIndex(leave => leave._id === action.payload._id);
        if (index !== -1) {
          state.leaves[index] = action.payload;
        }
      })

      // Reject leave
      .addCase(rejectLeave.fulfilled, (state, action: PayloadAction<Leave>) => {
        const index = state.leaves.findIndex(leave => leave._id === action.payload._id);
        if (index !== -1) {
          state.leaves[index] = action.payload;
        }
      })

      // Cancel leave
      .addCase(cancelLeave.fulfilled, (state, action: PayloadAction<Leave>) => {
        const index = state.leaves.findIndex(leave => leave._id === action.payload._id);
        if (index !== -1) {
          state.leaves[index] = action.payload;
        }
      })

      // Get leave summary
      .addCase(getLeaveSummary.fulfilled, (state, action: PayloadAction<LeaveSummary>) => {
        state.summary = action.payload;
      });
  }
});

export const { clearError, clearSummary } = leaveSlice.actions;
export default leaveSlice.reducer;