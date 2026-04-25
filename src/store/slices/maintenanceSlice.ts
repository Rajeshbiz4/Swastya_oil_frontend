import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export type MaintenanceType = 'Preventive' | 'Corrective' | 'Breakdown' | 'Emergency' | 'Loss';

export interface MaintenanceRecord {
  _id: string;
  date: string;
  maintenanceType: MaintenanceType;
  description: string;
  amount: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceAnalytics {
  summary: {
    totalCostToday: number;
    totalCostMonth: number;
    totalCount: number;
  };
  byType: { _id: string; count: number; totalAmount: number }[];
  byMonth: { _id: { year: number; month: number }; totalAmount: number; count: number }[];
}

interface MaintenanceState {
  records: MaintenanceRecord[];
  analytics: MaintenanceAnalytics | null;
  loading: boolean;
  analyticsLoading: boolean;
  error: string | null;
  pagination: { total: number; page: number; limit: number; pages: number };
}

const initialState: MaintenanceState = {
  records: [],
  analytics: null,
  loading: false,
  analyticsLoading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 20, pages: 0 },
};

export const fetchMaintenance = createAsyncThunk(
  'maintenance/fetchAll',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/maintenance', { params });
      return res.data.data;
    } catch (e: any) {
      return rejectWithValue(e?.error?.message || e?.message || 'Failed to fetch');
    }
  }
);

export const createMaintenance = createAsyncThunk(
  'maintenance/create',
  async (data: Partial<MaintenanceRecord>, { rejectWithValue }) => {
    try {
      const res = await api.post('/maintenance', data);
      return res.data.data;
    } catch (e: any) {
      return rejectWithValue(e?.error?.message || e?.message || 'Failed to create');
    }
  }
);

export const updateMaintenance = createAsyncThunk(
  'maintenance/update',
  async ({ id, data }: { id: string; data: Partial<MaintenanceRecord> }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/maintenance/${id}`, data);
      return res.data.data;
    } catch (e: any) {
      return rejectWithValue(e?.error?.message || e?.message || 'Failed to update');
    }
  }
);

export const deleteMaintenance = createAsyncThunk(
  'maintenance/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/maintenance/${id}`);
      return id;
    } catch (e: any) {
      return rejectWithValue(e?.error?.message || e?.message || 'Failed to delete');
    }
  }
);

export const fetchAnalytics = createAsyncThunk(
  'maintenance/analytics',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/maintenance/analytics', { params });
      return res.data.data;
    } catch (e: any) {
      return rejectWithValue(e?.error?.message || e?.message || 'Failed to fetch analytics');
    }
  }
);

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaintenance.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchMaintenance.fulfilled, (s, a: PayloadAction<any>) => {
        s.loading = false;
        s.records = a.payload.records;
        s.pagination = a.payload.pagination;
      })
      .addCase(fetchMaintenance.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })

      .addCase(createMaintenance.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(createMaintenance.fulfilled, (s, a: PayloadAction<MaintenanceRecord>) => {
        s.loading = false;
        s.records.unshift(a.payload);
      })
      .addCase(createMaintenance.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })

      .addCase(updateMaintenance.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(updateMaintenance.fulfilled, (s, a: PayloadAction<MaintenanceRecord>) => {
        s.loading = false;
        const idx = s.records.findIndex((r) => r._id === a.payload._id);
        if (idx !== -1) s.records[idx] = a.payload;
      })
      .addCase(updateMaintenance.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })

      .addCase(deleteMaintenance.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(deleteMaintenance.fulfilled, (s, a: PayloadAction<string>) => {
        s.loading = false;
        s.records = s.records.filter((r) => r._id !== a.payload);
      })
      .addCase(deleteMaintenance.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })

      .addCase(fetchAnalytics.pending, (s) => { s.analyticsLoading = true; })
      .addCase(fetchAnalytics.fulfilled, (s, a: PayloadAction<MaintenanceAnalytics>) => {
        s.analyticsLoading = false;
        s.analytics = a.payload;
      })
      .addCase(fetchAnalytics.rejected, (s) => { s.analyticsLoading = false; });
  },
});

export const { clearError } = maintenanceSlice.actions;
export default maintenanceSlice.reducer;
