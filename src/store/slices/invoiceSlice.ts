import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

// Types
export interface InvoiceProduct {
  oilType: string;
  type: string;
  rate: number;
  qty: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  contact: string;
  address: string;
  gstNo?: string;
  products: InvoiceProduct[];
  note?: string;
  status?: 'pending' | 'completed' | 'failed';
  createdBy: string;
  remarks?: string;
}

interface InvoiceState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
}

const initialState: InvoiceState = {
  invoices: [],
  loading: false,
  error: null,
};


// ✅ Async Thunks

export const fetchInvoices = createAsyncThunk<
  Invoice[], // return type
  void,      // argument type
  { rejectValue: string }
>(
  'invoice/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/invoices');
      return res.data as Invoice[];
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to fetch invoices');
    }
  }
);

export const createInvoice = createAsyncThunk<
  Invoice,
  Partial<Invoice>,
  { rejectValue: string }
>(
  'invoice/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/invoices', data);
      return (res.data.data || res.data) as Invoice;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to create invoice');
    }
  }
);

export const updateInvoice = createAsyncThunk<
  Invoice,
  { id: string; data: Partial<Invoice> },
  { rejectValue: string }
>(
  'invoice/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/invoices/${id}`, data);
      return (res.data.data || res.data) as Invoice;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to update invoice');
    }
  }
);

export const deleteInvoice = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'invoice/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/invoices/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to delete invoice');
    }
  }
);

export const updateInvoiceStatus = createAsyncThunk<
  Invoice,
  { id: string; status: 'pending' | 'completed' | 'failed' },
  { rejectValue: string }
>(
  'invoice/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/invoices/${id}/status`, { status });
      return (res.data.data || res.data) as Invoice;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message ||
        err?.error?.message ||
        'Failed to update invoice status'
      );
    }
  }
);


// ✅ Slice

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: {
    clearInvoiceError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder

      // FETCH
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInvoices.fulfilled, (state, action: PayloadAction<Invoice[]>) => {
        state.loading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error fetching invoices';
      })

      // CREATE
      .addCase(createInvoice.fulfilled, (state, action: PayloadAction<Invoice>) => {
        state.invoices.unshift(action.payload);
      })

      // UPDATE
      .addCase(updateInvoice.fulfilled, (state, action: PayloadAction<Invoice>) => {
        const index = state.invoices.findIndex(i => i._id === action.payload._id);
        if (index !== -1) {
          state.invoices[index] = action.payload;
        }
      })

      // DELETE
      .addCase(deleteInvoice.fulfilled, (state, action: PayloadAction<string>) => {
        state.invoices = state.invoices.filter(i => i._id !== action.payload);
      })

      // STATUS UPDATE
      .addCase(updateInvoiceStatus.fulfilled, (state, action: PayloadAction<Invoice>) => {
        const index = state.invoices.findIndex(i => i._id === action.payload._id);
        if (index !== -1) {
          state.invoices[index] = action.payload;
        }
      });
  }
});

export const { clearInvoiceError } = invoiceSlice.actions;
export default invoiceSlice.reducer;