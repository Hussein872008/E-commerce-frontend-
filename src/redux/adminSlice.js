import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../utils/api';


export const fetchAllUsers = createAsyncThunk(
  'admin/fetchAllUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/users', { params });
      const data = response.data || {};
      return {
        users: data.users || [],
        total: data.total || (data.users ? data.users.length : 0),
        page: data.page || 1,
        pages: data.pages || 1,
        limit: data.limit || params.limit || 10
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
  await api.delete(`/api/users/${userId}`);
      return userId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateUserRole = createAsyncThunk(
  'admin/updateUserRole',
  async ({ userId, role }, { rejectWithValue }) => {
    try {
  const response = await api.put(`/api/users/${userId}/role`, { role });
      return response.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAllOrders = createAsyncThunk(
  'admin/fetchAllOrders',
  async (_, { rejectWithValue }) => {
    try {
  const response = await api.get('/api/orders/all');
      return response.data.orders;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAdminStats = createAsyncThunk(
  'admin/fetchAdminStats',
  async (_, { rejectWithValue }) => {
    try {
  const response = await api.get('/api/users/stats');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchRecentOrders = createAsyncThunk(
  'admin/fetchRecentOrders',
  async (_, { rejectWithValue }) => {
    try {
  const response = await api.get('/api/orders/recent');
      return response.data.orders;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'admin/updateOrderStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
  const response = await api.put(`/api/orders/admin/update/${orderId}`, { status });
      return response.data.order;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateSellerOrderStatus = createAsyncThunk(
  'admin/updateSellerOrderStatus',
  async ({ orderId, status }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await api.put(`/api/orders/seller/update/${orderId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.order;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAllProducts = createAsyncThunk(
  'admin/fetchAllProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/products', { params });
      const data = response.data || {};
      return {
        products: data.products || data.data || [],
        total: data.total || data.count || (data.products ? data.products.length : 0),
        page: data.page || 1,
        pages: data.pages || 1,
        limit: data.limit || params.limit || 20
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'admin/deleteProduct',
  async (productId, { rejectWithValue }) => {
    try {
  await api.delete(`/api/products/${productId}`);
      return productId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSellerOrders = createAsyncThunk(
  'admin/fetchSellerOrders',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await api.get('/api/orders/seller', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.orders;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    users: [],
    products: [],
    usersTotal: 0,
    usersPage: 1,
    usersPages: 1,
    productsTotal: 0,
    productsPage: 1,
    productsPages: 1,
    orders: [],
    recentOrders: [],
    sellerOrders: [],
    stats: {},
    loading: false,
    updating: false,
    error: null,
    updateError: null
  },
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users || [];
        state.usersTotal = action.payload.total || 0;
        state.usersPage = action.payload.page || 1;
        state.usersPages = action.payload.pages || 1;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter(user => user._id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(updateUserRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex(user => user._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(fetchAdminStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(fetchRecentOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecentOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.recentOrders = action.payload;
      })
      .addCase(fetchRecentOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.updating = true;
        state.error = null;
        state.updateError = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.updating = false;
        state.updateError = null;
        
        const index = state.orders.findIndex(order => order._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        
        const recentIndex = state.recentOrders.findIndex(order => order._id === action.payload._id);
        if (recentIndex !== -1) {
          state.recentOrders[recentIndex] = action.payload;
        }
        
        const sellerIndex = state.sellerOrders.findIndex(order => order._id === action.payload._id);
        if (sellerIndex !== -1) {
          state.sellerOrders[sellerIndex] = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.updating = false;
        state.error = action.payload;
        state.updateError = action.payload;
      })
      .addCase(updateSellerOrderStatus.pending, (state) => {
        state.loading = true;
        state.updating = true;
        state.error = null;
        state.updateError = null;
      })
      .addCase(updateSellerOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.updating = false;
        state.updateError = null;

        const index = state.orders.findIndex(order => order._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }

        const recentIndex = state.recentOrders.findIndex(order => order._id === action.payload._id);
        if (recentIndex !== -1) {
          state.recentOrders[recentIndex] = action.payload;
        }

        const sellerIndex = state.sellerOrders.findIndex(order => order._id === action.payload._id);
        if (sellerIndex !== -1) {
          state.sellerOrders[sellerIndex] = action.payload;
        }
      })
      .addCase(updateSellerOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.updating = false;
        state.error = action.payload;
        state.updateError = action.payload;
      })
      
      .addCase(fetchAllProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products || [];
        state.productsTotal = action.payload.total || 0;
        state.productsPage = action.payload.page || 1;
        state.productsPages = action.payload.pages || 1;
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter(product => product._id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchSellerOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerOrders = action.payload;
      })
      .addCase(fetchSellerOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

  }
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;