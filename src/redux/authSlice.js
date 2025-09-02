import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// الحالة الأولية
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  success: null,
  role: JSON.parse(localStorage.getItem('user'))?.role || null
};

// Helper function to handle API errors
const handleApiError = (error, defaultMessage) => {
  console.error('API Error:', error);
  
  if (error.response?.data?.errors) {
    const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
    return errorMessages;
  }
  
  return error.response?.data?.message || defaultMessage;
};

// ثنك لتحديث التوكن
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
      localStorage.setItem('token', data.token);
      return data.token;
    } catch (err) {
      return rejectWithValue(handleApiError(err, 'Token refresh failed'));
    }
  }
);

// تسجيل مستخدم جديد
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/register', {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        passwordConfirm: userData.passwordConfirm,
        role: userData.role
      });

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Registration failed');
      }

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { token, user, role: user.role };
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Registration failed'));
    }
  }
);

// تسجيل الدخول
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Login failed');
      }

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { token, user, role: user.role };
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Login failed'));
    }
  }
);

// التحقق من صحة التوكن
export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return rejectWithValue('No token found');

      const response = await axios.get('/api/auth/verify-token', {
        headers: { Authorization: `Bearer ${token}` }
      });

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

// Update profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ userId, token, updates }, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Only send password fields if they're provided
      const updateData = {
        name: updates.name,
      };

      if (updates.currentPassword && updates.newPassword) {
        updateData.currentPassword = updates.currentPassword;
        updateData.newPassword = updates.newPassword;
      }

      const response = await axios.patch(
        `/api/users/${userId}`,
        updateData,
        config
      );

      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Update failed');
      }

      // Update local storage
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

// Forgot Password
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      return res.data.message;
    } catch (err) {
      return rejectWithValue(handleApiError(err, 'Error sending reset link'));
    }
  }
);

// Reset Password
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password, passwordConfirm }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/api/auth/reset-password/${token}`, { password, passwordConfirm });
      return res.data.message;
    } catch (err) {
      return rejectWithValue(handleApiError(err, 'Error resetting password'));
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
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
      // register
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
      // login
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
      // verify token
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
      // update profile
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
      // refresh token
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
      // forgot password
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
      // reset password
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
  }
});

export const { logout, clearError, clearSuccess, setLoading } = authSlice.actions;
export default authSlice.reducer;