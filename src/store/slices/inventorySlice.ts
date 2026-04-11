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
  oilWeight: number;
  costPerKg: number;
  totalOilPurchases?: number;
  averageRate?: number;
  purchaseDate: string;
  oilType: string;
  isActive: boolean;
}

interface OilInventory {
  _id: string;
  skuSize: string;
  packagingType: string;
  openingStock: number;
  totalPurchased: number;
  totalUsed: number;
  ratePerUnit?: number;
  totalCost?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  lastUpdated?: string;
  quantity?: number;
}

interface OilPurchase {
  _id: string;
  supplierName: string;
  quantity: number;
  ratePerLiter: number;
  paymentMode: string;
  invoiceNumber: string;
  invoiceDate: string;
  deliveryDate: string;
  oilType: string;
  brokerage: number;
  actualWeight: number;
  tankerTransport: number;
  extraCharges: number;
  totalAmount: number;
  isPaid: boolean;
  createdAt: string;
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
  oilInventory: OilInventory[];
  oilPurchases: OilPurchase[];
  packaging: PackagingInventory[];
  finishedGoods: FinishedGoodsInventory[];
  isLoading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  rawOil: [],
  oilInventory: [],
  oilPurchases: [],
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
      debugger;
      const response = await api.get<ApiResponse<{ inventory: RawOilInventory[]; pagination: any }>>('/inventory/raw-oil');
      if (response.data.success && response.data.data) {
        return response.data.data.inventory || [];
      }
      throw new Error('Failed to fetch raw oil inventory');
    } catch (error: any) {
      return rejectWithValue(error.error?.message || 'Failed to fetch raw oil inventory');
    }
  }
);

export const fetchOilInventory = createAsyncThunk<OilInventory[]>(
  'inventory/fetchOilInventory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<{ inventory: OilInventory[]; pagination: any }>>('/inventory/oil');
      if (response.data.success && response.data.data) {
        return response.data.data.inventory || [];
      }
      throw new Error('Failed to fetch oil inventory');
    } catch (error: any) {
      return rejectWithValue(error.error?.message || 'Failed to fetch oil inventory');
    }
  }
);

export const fetchPackagingInventory = createAsyncThunk<PackagingInventory[]>(
  'inventory/fetchPackaging',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<{ inventory: PackagingInventory[]; pagination: any }>>('/inventory/packaging');
      if (response.data.success && response.data.data) {
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
        return response.data.data.inventory || [];
      }
      throw new Error('Failed to fetch finished goods inventory');
    } catch (error: any) {
      return rejectWithValue(error.error?.message || 'Failed to fetch finished goods inventory');
    }
  }
);

export const fetchOilPurchases = createAsyncThunk<OilPurchase[]>(
  'inventory/fetchOilPurchases',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<{ purchases: OilPurchase[]; pagination: any }>>('/procurement/oil-purchases');
      if (response.data.success && response.data.data) {
        return response.data.data.purchases || [];
      }
      throw new Error('Failed to fetch oil purchases');
    } catch (error: any) {
      return rejectWithValue(error.error?.message || 'Failed to fetch oil purchases');
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
      .addCase(fetchOilInventory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOilInventory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.oilInventory = action.payload;
      })
      .addCase(fetchOilInventory.rejected, (state, action) => {
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
      })
      // Oil Purchases
      .addCase(fetchOilPurchases.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOilPurchases.fulfilled, (state, action) => {
        state.isLoading = false;
        state.oilPurchases = action.payload;
      })
      .addCase(fetchOilPurchases.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = inventorySlice.actions;
export default inventorySlice.reducer;