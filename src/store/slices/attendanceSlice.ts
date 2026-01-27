import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface Attendance {
  _id: string;
  workerId: string;
  attendanceDate: string;
  status: 'Present' | 'Absent' | 'Leave';
  hoursWorked: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  totalHours: number;
}

interface AttendanceState {
  attendance: Attendance[];
  summary: AttendanceSummary | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const initialState: AttendanceState = {
  attendance: [],
  summary: null,
  loading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 20, pages: 0 }
};

// Thunks
export const recordAttendance = createAsyncThunk(
  'attendance/recordAttendance',
  async (
    data: {
      workerId: string;
      attendanceDate: string;
      status: 'Present' | 'Absent' | 'Leave';
      hoursWorked?: number;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/workers/attendance', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to record attendance');
    }
  }
);

export const getWorkerAttendance = createAsyncThunk(
  'attendance/getWorkerAttendance',
  async (
    { workerId, startDate, endDate }: { workerId: string; startDate?: string; endDate?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(`/workers/attendance/worker/${workerId}`, {
        params: { startDate, endDate }
      });
      return response.data.data.attendance;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch attendance');
    }
  }
);

export const getAttendanceSummary = createAsyncThunk(
  'attendance/getAttendanceSummary',
  async (
    { workerId, startDate, endDate }: { workerId: string; startDate?: string; endDate?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(`/workers/attendance/worker/${workerId}/summary`, {
        params: { startDate, endDate }
      });
      return response.data.data.summary;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch attendance summary');
    }
  }
);

export const getAllAttendance = createAsyncThunk(
  'attendance/getAllAttendance',
  async (
    params: {
      workerId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get('/workers/attendance', { params });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch attendance records');
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
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
    // Record attendance
    builder.addCase(recordAttendance.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(recordAttendance.fulfilled, (state, action: PayloadAction<Attendance>) => {
      state.loading = false;
      const index = state.attendance.findIndex((a) => a._id === action.payload._id);
      if (index !== -1) {
        state.attendance[index] = action.payload;
      } else {
        state.attendance.push(action.payload);
      }
    });
    builder.addCase(recordAttendance.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get worker attendance
    builder.addCase(getWorkerAttendance.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getWorkerAttendance.fulfilled, (state, action: PayloadAction<Attendance[]>) => {
      state.loading = false;
      state.attendance = action.payload;
    });
    builder.addCase(getWorkerAttendance.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get attendance summary
    builder.addCase(getAttendanceSummary.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getAttendanceSummary.fulfilled, (state, action: PayloadAction<AttendanceSummary>) => {
      state.loading = false;
      state.summary = action.payload;
    });
    builder.addCase(getAttendanceSummary.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get all attendance
    builder.addCase(getAllAttendance.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getAllAttendance.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.attendance = action.payload.attendance;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(getAllAttendance.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const { clearError, clearSummary } = attendanceSlice.actions;
export default attendanceSlice.reducer;
