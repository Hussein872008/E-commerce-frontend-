import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// جلب جميع المنتجات
export const fetchAllProducts = createAsyncThunk(
  'products/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/products');
      return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch products");
    }
  }
);

// جلب المنتجات المفلترة
export const fetchFilteredProducts = createAsyncThunk(
  'products/fetchFiltered',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/products/filtered', { params: filters });
      return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch filtered products");
    }
  }
);

// جلب المنتجات الخاصة بالبائع الحالي
export const fetchMyProducts = createAsyncThunk(
  'products/fetchMyProducts',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get('/api/products/seller/my-products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch products");
    }
  }
);

// جلب تفاصيل منتج معين
export const fetchProductDetails = createAsyncThunk(
  'products/fetchDetails',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/products/${productId}`);
      return response.data || null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch product details");
    }
  }
);

// جلب المنتجات المتشابهة
// في fetchRelatedProducts داخل productSlice.js
export const fetchRelatedProducts = createAsyncThunk(
  'products/fetchRelated',
  async ({ category, excludeId }, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/products/filtered', {
        params: { category, limit: 4, exclude: excludeId }
      });
      // تأكد من أن الخادم يرجع products بدلاً من data
      return Array.isArray(response.data.products) ? response.data.products : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch related products");
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
    isFiltered: false
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
      // جلب جميع المنتجات
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

      // جلب المنتجات المفلترة
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

      // جلب منتجات البائع
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

      // جلب تفاصيل المنتج
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

      // جلب المنتجات المتشابهة
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
      });
  },
});

export const { clearProductError, resetFilters } = productSlice.actions;
export default productSlice.reducer;
