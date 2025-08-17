import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// جلب عدد العناصر في الويش ليست
export const fetchWishlistCount = createAsyncThunk(
  'wishlist/fetchCount',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(`/api/wishlist/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.count;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch wishlist count');
    }
  }
);

// التحقق إذا المنتج موجود في الويش ليست
export const checkWishlistStatus = createAsyncThunk(
  'wishlist/checkStatus',
  async (productId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.get(
        `/api/wishlist/check/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { productId, isInWishlist: response.data.isInWishlist };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to check wishlist status');
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    count: 0,
    wishlistItems: {}, // { productId: true/false }
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
      const { productId, status } = action.payload;
      state.wishlistItems[productId] = status;
    },
    resetWishlist: (state) => {
      state.count = 0;
      state.wishlistItems = {};
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchWishlistCount
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

      // checkWishlistStatus
      .addCase(checkWishlistStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkWishlistStatus.fulfilled, (state, action) => {
        state.loading = false;
        const { productId, isInWishlist } = action.payload;
        state.wishlistItems[productId] = isInWishlist;
      })
      .addCase(checkWishlistStatus.rejected, (state, action) => {
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
