import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { ApiResponse } from '../../types';

interface RawOilInventory {
  _id: string;
  purchaseId: string;
  batchNumber: string;
  initialQuantity: number;
  currentQuantity: number;
  costPerLiter: number;
  purchaseDate: string;
  isActive: boolean;
}

interface PackagingInventory {
  _id: string;
  skuSize: string;
  packagingType: string;
  quantity: number;
  ratePerUnit: number;
  totalPurchasedQuantity?: number;
  totalCost?: number;
  invoiceNumber: string;
  invoiceDate: string;
  lastUpdated?: string;
  currentStock?: number; // Virtual field, may not always be present
}

interface FinishedGoodsInventory {
  _id: string;
  skuSize: string;
  packagingType: string;
  batchId: string;
  quantity: number;
  unitCost: number;
  productionDate: string;
  expiryDate: string;
  isActive: boolean;
}

interface InventoryState {
  rawOil: RawOilInventory[];
  packaging: PackagingInventory[];
  finishedGoods: FinishedGoodsInventory[];
  isLoading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  rawOil: [],
  packaging: [],
  finishedGoods: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchRawOilInventory = createAsyncThunk<RawOilInventory[]>(
  'inventory/fetchRawOil',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<{ inventory: RawOilInventory[]; pagination: any }>>('/inventory/raw-oil');
      if (response.data.success && response.data.data) {
        // Extract the inventory array from the nested structure
        return response.data.data.inventory || [];
      }
      throw new Error('Failed to fetch raw oil inventory');
    } catch (error: any) {
      return rejectWithValue(error.error?.message || 'Failed to fetch raw oil inventory');
    }
  }
);

export const fetchPackagingInventory = createAsyncThunk<PackagingInventory[]>(
  'inventory/fetchPackaging',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<{ inventory: PackagingInventory[]; pagination: any }>>('/inventory/packaging');
      if (response.data.success && response.data.data) {
        // Extract the inventory array from the nested structure
        return response.data.data.inventory || [];
      }
      throw new Error('Failed to fetch packaging inventory');
    } catch (error: any) {
      return rejectWithValue(error.error?.message || 'Failed to fetch packaging inventory');
    }
  }
);

export const fetchFinishedGoodsInventory = createAsyncThunk<FinishedGoodsInventory[]>(
  'inventory/fetchFinishedGoods',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<{ inventory: FinishedGoodsInventory[]; pagination: any }>>('/inventory/finished-goods');
      if (response.data.success && response.data.data) {
        // Extract the inventory array from the nested structure
        return response.data.data.inventory || [];
      }
      throw new Error('Failed to fetch finished goods inventory');
    } catch (error: any) {
      return rejectWithValue(error.error?.message || 'Failed to fetch finished goods inventory');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Raw Oil Inventory
      .addCase(fetchRawOilInventory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRawOilInventory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rawOil = action.payload;
      })
      .addCase(fetchRawOilInventory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Packaging Inventory
      .addCase(fetchPackagingInventory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPackagingInventory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.packaging = action.payload;
      })
      .addCase(fetchPackagingInventory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Finished Goods Inventory
      .addCase(fetchFinishedGoodsInventory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFinishedGoodsInventory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.finishedGoods = action.payload;
      })
      .addCase(fetchFinishedGoodsInventory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = inventorySlice.actions;
export default inventorySlice.reducer;