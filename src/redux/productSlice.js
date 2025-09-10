import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAuthToken } from '../utils/api';

export const fetchAllProducts = createAsyncThunk(
  'products/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
  const response = await api.get('/api/products');
      return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch products");
    }
  }
);

export const fetchFilteredProducts = createAsyncThunk(
  'products/fetchFiltered',
  async (filters, { rejectWithValue }) => {
    try {
  const response = await api.get('/api/products/filtered', { params: filters });
      return Array.isArray(response.data.products) ? response.data.products : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch filtered products");
    }
  }
);

export const fetchMyProducts = createAsyncThunk(
  'products/fetchMyProducts',
  async (_, { getState, rejectWithValue }) => {
    try {
  const token = getState().auth.token;
  setAuthToken(token);
  const response = await api.get('/api/products/seller/my-products');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch products");
    }
  }
);

export const fetchProductDetails = createAsyncThunk(
  'products/fetchDetails',
  async (productId, { rejectWithValue }) => {
    try {
  const response = await api.get(`/api/products/${productId}`);
      return response.data || null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch product details");
    }
  }
);

export const fetchRelatedProducts = createAsyncThunk(
  'products/fetchRelated',
  async ({ category, excludeId }, { rejectWithValue }) => {
    try {
  const response = await api.get('/api/products/filtered', {
        params: { category, limit: 4, exclude: excludeId }
      });
      return Array.isArray(response.data.products) ? response.data.products : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch related products");
    }
  }
);

export const fetchSellerDashboardStats = createAsyncThunk(
  'products/fetchSellerDashboardStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      setAuthToken(token);
      const response = await api.get('/api/products/seller/dashboard');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch dashboard stats");
    }
  }
);

export const fetchSellerSalesData = createAsyncThunk(
  'products/fetchSellerSalesData',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      setAuthToken(token);
      const response = await api.get('/api/products/seller/sales-data');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch sales data");
    }
  }
);

export const fetchSellerPopularProducts = createAsyncThunk(
  'products/fetchSellerPopularProducts',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      setAuthToken(token);
      const response = await api.get('/api/products/seller/popular');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch popular products");
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    allProducts: [],
    filteredProducts: [],
    myProducts: [],
    currentProduct: null,
    relatedProducts: [],
    loading: false,
    error: null,
    filters: {},
    isFiltered: false,
    sellerDashboardStats: {
      productsCount: 0,
      ordersCount: 0,
      totalSales: 0,
      recentOrders: [],
      popularProducts: [],
      stockAlerts: [],
      monthlySales: [],
      categoryStats: [],
      orderStatusStats: [],
      revenueGrowth: 0,
      orderGrowth: 0,
      productViews: 0,
      conversionRate: 0
    },
    sellerSalesData: [],
    sellerPopularProducts: []
  },
  reducers: {
    clearProductError: (state) => {
      state.error = null;
    },
    resetFilters: (state) => {
      state.filteredProducts = [];
      state.isFiltered = false;
      state.filters = {};
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.allProducts = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchFilteredProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFilteredProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredProducts = Array.isArray(action.payload) ? action.payload : [];
        state.isFiltered = true;
        state.allProducts = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchFilteredProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchMyProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.myProducts = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMyProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchProductDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload || null;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchRelatedProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRelatedProducts.fulfilled, (state, action) => {
  state.loading = false;
  state.relatedProducts = (Array.isArray(action.payload) ? action.payload : []).filter(
    prod => prod._id !== state.currentProduct?._id
  );
})
      .addCase(fetchRelatedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchSellerDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerDashboardStats = {
          ...state.sellerDashboardStats,
          ...action.payload
        };
      })
      .addCase(fetchSellerDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchSellerSalesData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerSalesData.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerSalesData = action.payload;
      })
      .addCase(fetchSellerSalesData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchSellerPopularProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerPopularProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerPopularProducts = action.payload;
      })
      .addCase(fetchSellerPopularProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProductError, resetFilters } = productSlice.actions;
export default productSlice.reducer;
