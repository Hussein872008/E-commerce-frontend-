import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAuthToken } from '../utils/api';

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  success: null,
  role: JSON.parse(localStorage.getItem('user'))?.role || null
};

const handleApiError = (error, defaultMessage) => {
  console.error('API Error:', error?.message || error);
  const resp = error?.response?.data || null;
  const status = error?.response?.status;

  if (resp?.errors && Array.isArray(resp.errors)) {
    const errorMessages = resp.errors.map(err => err.msg).join(', ');
    return errorMessages;
  }

  if (resp?.message) return resp.message;
  if (resp?.error) return resp.error;
  if (resp?.details) return resp.details;

  if (status) return `Request failed with status ${status}`;

  return defaultMessage;
};

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
  const storedRefresh = localStorage.getItem('refreshToken');
  const body = storedRefresh ? { refreshToken: storedRefresh } : {};
  const { data } = await api.post('/api/auth/refresh-token', body, { withCredentials: true });
      if (data?.token) localStorage.setItem('token', data.token);
      if (data?.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      return data.token;
    } catch (err) {
      return rejectWithValue(handleApiError(err, 'Token refresh failed'));
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
  const response = await api.post('/api/auth/register', {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        passwordConfirm: userData.passwordConfirm,
        role: userData.role
      });

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Registration failed');
      }

  const { token, user, refreshToken } = response.data;
  if (token) localStorage.setItem('token', token);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));

      return { token, user, role: user.role };
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Registration failed'));
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
  const response = await api.post('/api/auth/login', { email, password });

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Login failed');
      }

  const { token, user, refreshToken } = response.data;
  if (token) localStorage.setItem('token', token);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));

      return { token, user, role: user.role };
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Login failed'));
    }
  }
);

export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return rejectWithValue('No token found');

  setAuthToken(token);
  const response = await api.get('/api/auth/verify-token');

      if (!response.data.user || !response.data.user.role) {
        throw new Error('Invalid user data');
      }

      return { user: response.data.user, role: response.data.user.role };
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return rejectWithValue(handleApiError(error, 'Session expired'));
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ userId, token, updates }, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const updateData = {
        name: updates.name,
      };

      if (updates.currentPassword && updates.newPassword) {
        updateData.currentPassword = updates.currentPassword;
        updateData.newPassword = updates.newPassword;
      }

  setAuthToken(token);
  const response = await api.patch(`/api/users/${userId}`, updateData, config);

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Update failed');
      }

      const updatedUser = {
        ...JSON.parse(localStorage.getItem('user')),
        name: updates.name,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      return updatedUser;
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Update failed'));
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
  const res = await api.post('/api/auth/forgot-password', { email });
      return res.data.message;
    } catch (err) {
      return rejectWithValue(handleApiError(err, 'Error sending reset link'));
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password, passwordConfirm }, { rejectWithValue }) => {
    try {
  const res = await api.patch(`/api/auth/reset-password/${token}`, { password, passwordConfirm });
      return res.data.message;
    } catch (err) {
      return rejectWithValue(handleApiError(err, 'Error resetting password'));
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  async ({ password }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }


  setAuthToken(token);
  const response = await api.delete('/api/users/me', { data: { password } });

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      return response.data.message || 'Account deleted successfully';
    } catch (err) {
      return rejectWithValue(handleApiError(err, 'Failed to delete account'));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.role = null;
      state.error = null;
      state.success = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.user.role;
        state.success = 'Registration successful';
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
        state.success = null;
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.user.role;
        state.success = 'Login successful';
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
        state.success = null;
      })
      .addCase(verifyToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.role = action.payload.user.role;
        state.error = null;
      })
      .addCase(verifyToken.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.success = 'Profile updated successfully';
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.success = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.role = null;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = action.payload;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.success = null;
      })
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = action.payload;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.success = null;
      });
      builder
        .addCase(deleteAccount.pending, (state) => {
          state.isLoading = true;
          state.error = null;
          state.success = null;
        })
        .addCase(deleteAccount.fulfilled, (state, action) => {
          state.isLoading = false;
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          state.success = action.payload;
          state.error = null;
        })
        .addCase(deleteAccount.rejected, (state, action) => {
          state.isLoading = false;
          state.error = action.payload;
          state.success = null;
        });
  }
});

export const { logout, clearError, clearSuccess, setLoading } = authSlice.actions;
export default authSlice.reducer;