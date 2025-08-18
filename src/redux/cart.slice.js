import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

axios.defaults.baseURL = "https://e-commerce-backend-production-7ac6.up.railway.app";

// Helper function
const processCartItems = (items) => {
  return items?.map((item, idx) => {
    const product = item.product || {};
    return {
      ...item,
      _id: item._id || `fallback-cart-${idx}`,
      product: {
        ...product,
        _id: product._id || `fallback-product-${idx}`,
        title: product.title || 'Product not available',
        price: product.price || item.price || 0,
        quantity: product.quantity ?? item.quantity ?? 1,
        image:
          product.image ||
          product.thumbnail ||
          (Array.isArray(product.images) && product.images.length > 0
            ? product.images[0]
            : '/placeholder-product.png')
      }
    };
  }) || [];
};

// Fetch Cart
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token, user } = getState().auth;
      if (!token || !user) return { items: [], total: 0 };

      const response = await axios.get('/api/cart', {
        params: { userId: user._id },
        headers: { Authorization: `Bearer ${token}` }
      });

      return {
        items: processCartItems(response.data.items),
        total: response.data.total || 0
      };
    } catch (error) {
      console.error("Fetch Cart Error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch cart');
    }
  }
);

// Add to Cart
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1 }, { getState, rejectWithValue }) => {
    try {
      const { token, user } = getState().auth;
      if (!token || !user) return rejectWithValue('User not authenticated');
      if (!productId) return rejectWithValue('Product ID required');

      await axios.post('/api/cart/add',
        { productId, quantity, userId: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return { productId, quantity };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add item');
    }
  }
);

// Remove from Cart
export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId, { getState, rejectWithValue }) => {
    try {
      const { token, user } = getState().auth;
      // if (!token || !user) return rejectWithValue('User not authenticated');

      await axios.delete(`/api/cart/remove/${itemId}`, {
        params: { userId: user._id },
        headers: { Authorization: `Bearer ${token}` }
      });

      return itemId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove item');
    }
  }
);

// Update Cart Item
export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { getState, rejectWithValue }) => {
    try {
      const { token, user } = getState().auth;
      // if (!token || !user) return rejectWithValue('User not authenticated');

      await axios.put(`/api/cart/update/${itemId}`,
        { quantity, userId: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return { itemId, quantity };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update item');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    total: 0,
    loading: false,
    updatingItemId: null,
    error: null,
    lastUpdated: null,
    isInCart: {}
  },
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
      state.isInCart = {};
    },
    updateCartStatus: (state, action) => {
      const { productId, isInCart } = action.payload;
      state.isInCart[productId] = isInCart;
    },
    addItemOptimistically: (state, action) => {
      const product = action.payload;
      const existing = state.items.find(i => i.product._id === product._id);
      if (!existing) {
        state.items.push({ product, quantity: 1 });
        state.isInCart[product._id] = true;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.lastUpdated = new Date().toISOString();
        state.isInCart = {};
        action.payload.items.forEach(item => {
          if (item.product) state.isInCart[item.product._id] = true;
        });
      })
      .addCase(fetchCart.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(addToCart.pending, (state, action) => { state.updatingItemId = action.meta.arg.productId; })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.updatingItemId = null;
        state.isInCart[action.payload.productId] = true;
      })
      .addCase(addToCart.rejected, (state, action) => { state.updatingItemId = null; state.error = action.payload; })
      .addCase(removeFromCart.pending, (state, action) => { state.updatingItemId = action.meta.arg; })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.updatingItemId = null;
        state.items = state.items.filter(item => item._id !== action.payload && item.product._id !== action.payload);
        delete state.isInCart[action.payload];
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(removeFromCart.rejected, (state, action) => { state.updatingItemId = null; state.error = action.payload; })
      .addCase(updateCartItem.pending, (state, action) => { state.updatingItemId = action.meta.arg.itemId; })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.updatingItemId = null;
        const { itemId, quantity } = action.payload;
        const item = state.items.find(i => i._id === itemId || i.product._id === itemId);
        if (item) item.quantity = quantity;
      })
      .addCase(updateCartItem.rejected, (state, action) => { state.updatingItemId = null; state.error = action.payload; });
  }
});

export const { clearCart, updateCartStatus, addItemOptimistically } = cartSlice.actions;
export default cartSlice.reducer;
