import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAuthToken } from '../utils/api';

export const fetchWishlistCount = createAsyncThunk(
  'wishlist/fetchCount',
  async (_, { getState, rejectWithValue }) => {
    try {
  const { token } = getState().auth;
  setAuthToken(token);
  const response = await api.get(`/api/wishlist/count`);
      return response.data.count;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch wishlist count');
    }
  }
);

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      setAuthToken(token);
      const response = await api.get(`/api/wishlist`);
      return response.data.products || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch wishlist');
    }
  }
);



const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    count: 0,
    wishlistItems: {},
    wishlistById: {},
    loading: false,
    error: null
  },
  reducers: {
    incrementWishlistCount: (state) => {
      state.count += 1;
    },
    decrementWishlistCount: (state) => {
      state.count = Math.max(0, state.count - 1);
    },
    setWishlistStatus: (state, action) => {
      const { productId, status, product } = action.payload;
      state.wishlistItems[productId] = status;
      if (status && product) {
        state.wishlistById[productId] = product;
      } else if (!status) {
        delete state.wishlistById[productId];
      }
    },
    resetWishlist: (state) => {
      state.count = 0;
      state.wishlistItems = {};
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlistCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlistCount.fulfilled, (state, action) => {
        state.loading = false;
        state.count = action.payload;
      })
      .addCase(fetchWishlistCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      ;
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        const products = action.payload || [];
        state.count = products.length;
        const idMap = {};
        const byId = {};
        products.forEach(item => {
          const prod = item?.product || item;
          const id = prod?._id || (prod && String(prod));
          if (id) {
            idMap[id] = true;
            byId[id] = prod;
          }
        });
        state.wishlistItems = idMap;
        state.wishlistById = byId;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  incrementWishlistCount, 
  decrementWishlistCount,
  setWishlistStatus,
  resetWishlist
} = wishlistSlice.actions;
export default wishlistSlice.reducer;
