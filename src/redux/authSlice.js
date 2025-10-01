import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAuthToken } from '../utils/api';
import { normalizeUser, resolveUserId } from '../utils/user';

const resolveRoleFromUser = (user) => {
  if (!user) return null;
  return user.role || user.activeRole || (Array.isArray(user.roles) && user.roles.length ? user.roles[0] : null);
}

  const storedUserRaw = JSON.parse(localStorage.getItem('user')) || null;
  const storedUser = normalizeUser(storedUserRaw);
  const initialState = {
  user: storedUser,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  success: null,
  role: resolveRoleFromUser(storedUser)
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
  const { data } = await api.post('/api/auth/refresh-token', {}, { withCredentials: true });
      if (data?.token) {
        localStorage.setItem('token', data.token);
        setAuthToken(data.token);
      }
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

  const { token, user: rawUser } = response.data;
  const user = normalizeUser(rawUser);
  if (token) {
    localStorage.setItem('token', token);
    setAuthToken(token);
  }
  localStorage.setItem('user', JSON.stringify(user));

  return { token, user, role: resolveRoleFromUser(user) };
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

  const { token, user: rawUser } = response.data;
  const user = normalizeUser(rawUser);
  if (token) {
    localStorage.setItem('token', token);
    setAuthToken(token);
  }
  localStorage.setItem('user', JSON.stringify(user));

  return { token, user, role: resolveRoleFromUser(user) };
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

      if (!response.data.user) {
        throw new Error('Invalid user data');
      }

  const user = normalizeUser(response.data.user);
  localStorage.setItem('user', JSON.stringify(user));
  return { user, role: resolveRoleFromUser(user) };
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return rejectWithValue(handleApiError(error, 'Session expired'));
    }
  }
);

  export const switchRoleUser = createAsyncThunk(
    'auth/switchRole',
    async ({ userId, newRole }, { getState, rejectWithValue }) => {
      try {
        const token = getState().auth.token;
        if (!token) return rejectWithValue('Not authenticated');
        setAuthToken(token);
          console.debug('[switchRoleUser] sending request', { userId, newRole });
          const response = await api.put(`/api/users/${userId}/switch-role`, { newRole });
          console.debug('[switchRoleUser] response', response && response.data ? response.data : response);
        if (!response.data.success) return rejectWithValue(response.data.message || 'Role switch failed');
        return response.data.user;
      } catch (err) {
          console.error('[switchRoleUser] error', err);
        return rejectWithValue(handleApiError(err, 'Failed to switch role'));
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

      const raw = JSON.parse(localStorage.getItem('user') || 'null');
      const updatedUser = normalizeUser({
        ...(raw || {}),
        name: updates.name,
      });
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
  state.role = resolveRoleFromUser(action.payload.user);
    try { if (action.payload.token) { setAuthToken(action.payload.token); } } catch(e) {}
        state.success = 'Registration successful';
        state.error = null;
      })
      .addCase(switchRoleUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(switchRoleUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const normalized = normalizeUser(action.payload);
        state.user = normalized;
        state.role = resolveRoleFromUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
        state.success = 'Role switched successfully';
        state.error = null;
      })
      .addCase(switchRoleUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error?.message;
        state.success = null;
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
  state.role = resolveRoleFromUser(action.payload.user);
    try { if (action.payload.token) { setAuthToken(action.payload.token); } } catch(e) {}
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
  state.role = resolveRoleFromUser(action.payload.user);
    try { if (state.token) setAuthToken(state.token); } catch(e) {}
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
        const normalized = normalizeUser(action.payload);
        state.user = normalized;
        localStorage.setItem('user', JSON.stringify(normalized));
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