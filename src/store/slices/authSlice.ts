import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { User, ApiResponse } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('authToken'),
  isAuthenticated: !!localStorage.getItem('authToken'),
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk<LoginResponse, LoginCredentials>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('Login attempt for:', credentials.username);
      const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
      console.log('Login API response:', response.data);
      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;
        localStorage.setItem('authToken', token);
        return { user, token };
      }
      console.log('Login failed - no success or data');
      throw new Error('Login failed');
    } catch (error: any) {
      console.log('Login API error:', error);
      console.log('Login error response:', error.response?.data);
      return rejectWithValue(error.error?.message || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('authToken');
      return null;
    } catch (error: any) {
      localStorage.removeItem('authToken');
      return rejectWithValue(error.error?.message || 'Logout failed');
    }
  }
);

export const fetchProfile = createAsyncThunk<User>(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<User>>('/auth/profile');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to fetch profile');
    } catch (error: any) {
      return rejectWithValue(error.error?.message || 'Failed to fetch profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        console.log('Login successful - User role:', action.payload.user.role);
        console.log('Login successful - User data:', action.payload.user);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        console.log('Login failed - Error:', action.payload);
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem('authToken');
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;