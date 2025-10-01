import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAuthToken } from '../utils/api';
import serializeFilters from '../utils/queryKey';

export const fetchAllProducts = createAsyncThunk(
  'products/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
  const response = await api.get('/api/products', { params: { fields: '_id,title,price,discountPercentage,image,extraImages,quantity,minimumOrderQuantity,averageRating,reviewsCount,brand,sku,description' } });

      const d = response.data;
      if (Array.isArray(d)) return d;
      if (d && Array.isArray(d.data)) return d.data;
      if (d && Array.isArray(d.products)) return d.products;
      return [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch products");
    }
  }
);

export const fetchFilteredProducts = createAsyncThunk(
  'products/fetchFiltered',
  async (filters = {}, { rejectWithValue }) => {
    try {
    const params = { ...filters };

    const { page, limit, ...cacheableFilters } = filters || {};
    const cacheKey = serializeFilters({ ...cacheableFilters, fields: (filters && filters.fields) || '' });

      if (!fetchFilteredProducts._cache) fetchFilteredProducts._cache = new Map();
      const cache = fetchFilteredProducts._cache;


      const now = Date.now();
      const cached = cache.get(cacheKey);
      const isPageOne = !params.page || Number(params.page) === 1;
      if (isPageOne && cached && (now - cached.ts) < 2 * 60 * 1000) {
        return cached.value;
      }

      const response = await api.get('/api/products/filtered', { params });
      const payload = response.data || {};


      if (isPageOne) {
        try { cache.set(cacheKey, { value: payload, ts: Date.now() }); } catch(e){}
      }

      return payload;
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
    params: { category, limit: 4, exclude: excludeId, fields: '_id,title,price,discountPercentage,image,extraImages,quantity,minimumOrderQuantity,averageRating,reviewsCount,brand,sku,description,category' }
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

      const d = response.data;
      if (Array.isArray(d)) return d;
      if (d && Array.isArray(d.ordersSales)) return d.ordersSales;

      if (d && d.ordersSales && Array.isArray(d.ordersSales.ordersSales)) return d.ordersSales.ordersSales;
      return [];
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

      const d = response.data;
      if (Array.isArray(d)) return d;
      if (d && Array.isArray(d.popularProducts)) return d.popularProducts;
      return [];
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

    page: 1,
    pages: 1,
    total: 0,

  requestedPage: null,
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

      .addCase(fetchFilteredProducts.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        try {
          const reqPage = action?.meta?.arg && action.meta.arg.page ? Number(action.meta.arg.page) : 1;
          state.requestedPage = reqPage;
        } catch (e) { state.requestedPage = 1; }
      })
      .addCase(fetchFilteredProducts.fulfilled, (state, action) => {
        state.loading = false;

        state.requestedPage = null;
        const payload = action.payload || {};
    const products = Array.isArray(payload.products) ? payload.products : (Array.isArray(payload.data) ? payload.data : []);
    try { } catch(e) {}
        state.isFiltered = true;
 const requestedArgPage = action && action.meta && action.meta.arg && typeof action.meta.arg.page !== 'undefined'
          ? Number(action.meta.arg.page)
          : undefined;
        const page = (payload && typeof payload.page !== 'undefined')
          ? Number(payload.page)
          : (typeof requestedArgPage !== 'undefined' ? requestedArgPage : (state.filteredProducts && state.filteredProducts.length ? Number(state.page || 1) : 1));
        let pages = 1;
        const total = payload && (payload.total || payload.count) ? (Number(payload.total || payload.count) || 0) : (products.length || 0);
        if (payload && typeof payload.pages !== 'undefined') {
          pages = Number(payload.pages) || 1;
        } else if (payload && payload.total && (payload.count || products.length)) {
          const perPage = payload.count ? Number(payload.count) : (products.length || 1);
          pages = perPage > 0 ? Math.max(1, Math.ceil(Number(payload.total) / perPage)) : 1;
        } else {
          pages = 1;
        }

        if (page > 1) {
          const existingIds = new Set(state.filteredProducts.map(p => p._id));
          const newItems = products.filter(p => !existingIds.has(p._id));
          state.filteredProducts = state.filteredProducts.concat(newItems);
        } else {
          try { } catch (e) {}
          state.filteredProducts = products;
          state.allProducts = products;
        }

        state.page = page;
        state.pages = pages;
        state.total = total;
        try {
          const arg = action && action.meta && action.meta.arg ? action.meta.arg : {};
          const { page: _p, limit: _l, ...appliedFilters } = arg;
          state.filters = appliedFilters || {};
        } catch (e) {
          state.filters = state.filters || {};
        }
      })
      .addCase(fetchFilteredProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.requestedPage = null;
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
