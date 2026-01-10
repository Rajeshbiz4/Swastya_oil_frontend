import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface AssignedWork {
  _id?: string;
  batchId?: string;
  taskDescription: string;
  assignedDate: Date;
  completionDate?: Date;
  status: 'Assigned' | 'InProgress' | 'Completed';
}

interface Worker {
  _id: string;
  employeeId: string;
  name: string;
  phone: string;
  dailyWage: number;
  isActive: boolean;
  assignedWorks: AssignedWork[];
  totalWorkDays: number;
  totalLaborCost: number;
  createdAt: string;
  updatedAt: string;
}

interface WorkerState {
  workers: Worker[];
  selectedWorker: Worker | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const initialState: WorkerState = {
  workers: [],
  selectedWorker: null,
  loading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 10, pages: 0 }
};

// Thunks
export const fetchWorkers = createAsyncThunk(
  'worker/fetchWorkers',
  async (params: { page?: number; limit?: number; isActive?: boolean } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/workers', { params });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch workers');
    }
  }
);

export const fetchWorkerById = createAsyncThunk(
  'worker/fetchWorkerById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/workers/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch worker');
    }
  }
);

export const createWorker = createAsyncThunk(
  'worker/createWorker',
  async (data: { employeeId: string; name: string; phone: string; dailyWage: number }, { rejectWithValue }) => {
    try {
      const response = await api.post('/workers', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to create worker');
    }
  }
);

export const updateWorker = createAsyncThunk(
  'worker/updateWorker',
  async ({ id, data }: { id: string; data: Partial<Worker> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/workers/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update worker');
    }
  }
);

export const assignWork = createAsyncThunk(
  'worker/assignWork',
  async ({ id, taskDescription, batchId }: { id: string; taskDescription: string; batchId?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/workers/${id}/assign-work`, { taskDescription, batchId });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to assign work');
    }
  }
);

export const updateWorkStatus = createAsyncThunk(
  'worker/updateWorkStatus',
  async ({ id, workId, status }: { id: string; workId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/workers/${id}/work/${workId}/status`, { status });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update work status');
    }
  }
);

export const getAssignedWorks = createAsyncThunk(
  'worker/getAssignedWorks',
  async ({ id, status }: { id: string; status?: string }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/workers/${id}/assigned-works`, { params: { status } });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch assigned works');
    }
  }
);

export const deactivateWorker = createAsyncThunk(
  'worker/deactivateWorker',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/workers/${id}/deactivate`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to deactivate worker');
    }
  }
);

const workerSlice = createSlice({
  name: 'worker',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedWorker: (state) => {
      state.selectedWorker = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch workers
    builder.addCase(fetchWorkers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchWorkers.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.workers = action.payload.workers;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(fetchWorkers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch worker by ID
    builder.addCase(fetchWorkerById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchWorkerById.fulfilled, (state, action: PayloadAction<Worker>) => {
      state.loading = false;
      state.selectedWorker = action.payload;
    });
    builder.addCase(fetchWorkerById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create worker
    builder.addCase(createWorker.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createWorker.fulfilled, (state, action: PayloadAction<Worker>) => {
      state.loading = false;
      state.workers.push(action.payload);
    });
    builder.addCase(createWorker.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update worker
    builder.addCase(updateWorker.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateWorker.fulfilled, (state, action: PayloadAction<Worker>) => {
      state.loading = false;
      const index = state.workers.findIndex((w) => w._id === action.payload._id);
      if (index !== -1) {
        state.workers[index] = action.payload;
      }
      if (state.selectedWorker?._id === action.payload._id) {
        state.selectedWorker = action.payload;
      }
    });
    builder.addCase(updateWorker.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Assign work
    builder.addCase(assignWork.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(assignWork.fulfilled, (state, action: PayloadAction<Worker>) => {
      state.loading = false;
      const index = state.workers.findIndex((w) => w._id === action.payload._id);
      if (index !== -1) {
        state.workers[index] = action.payload;
      }
      if (state.selectedWorker?._id === action.payload._id) {
        state.selectedWorker = action.payload;
      }
    });
    builder.addCase(assignWork.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update work status
    builder.addCase(updateWorkStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateWorkStatus.fulfilled, (state, action: PayloadAction<Worker>) => {
      state.loading = false;
      const index = state.workers.findIndex((w) => w._id === action.payload._id);
      if (index !== -1) {
        state.workers[index] = action.payload;
      }
      if (state.selectedWorker?._id === action.payload._id) {
        state.selectedWorker = action.payload;
      }
    });
    builder.addCase(updateWorkStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Deactivate worker
    builder.addCase(deactivateWorker.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deactivateWorker.fulfilled, (state, action: PayloadAction<Worker>) => {
      state.loading = false;
      const index = state.workers.findIndex((w) => w._id === action.payload._id);
      if (index !== -1) {
        state.workers[index] = action.payload;
      }
      if (state.selectedWorker?._id === action.payload._id) {
        state.selectedWorker = action.payload;
      }
    });
    builder.addCase(deactivateWorker.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const { clearError, clearSelectedWorker } = workerSlice.actions;
export default workerSlice.reducer;
