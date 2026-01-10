import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import slices
import authSlice from './slices/authSlice';
import inventorySlice from './slices/inventorySlice';
import procurementSlice from './slices/procurementSlice';
import auditSlice from './slices/auditSlice';
import workerSlice from './slices/workerSlice';
import attendanceSlice from './slices/attendanceSlice';
import paymentSlice from './slices/paymentSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    inventory: inventorySlice,
    procurement: procurementSlice,
    audit: auditSlice,
    worker: workerSlice,
    attendance: attendanceSlice,
    payment: paymentSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;