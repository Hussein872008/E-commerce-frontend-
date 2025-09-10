import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import api, { setAuthToken } from '../utils/api';

export const clearCartThunk = createAsyncThunk(
  'cart/clearCartThunk',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token, user } = getState().auth;
      if (!token || !user) return rejectWithValue('User not authenticated');
      setAuthToken(token);
      await api.delete('/api/cart/clear');
      const response = await api.get('/api/cart', { params: { userId: user._id } });
      return {
        items: processCartItems(response.data.items),
        total: response.data.total || 0
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to clear cart');
    }
  }
);

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
        quantity: typeof product.quantity === 'number' ? product.quantity : (typeof item.quantity === 'number' ? item.quantity : 0),
        minimumOrderQuantity: (product.minimumOrderQuantity && product.minimumOrderQuantity > 0) ? product.minimumOrderQuantity : (item.minimumOrderQuantity && item.minimumOrderQuantity > 0 ? item.minimumOrderQuantity : 1),
        image:
          product.image ||
          product.thumbnail ||
          (Array.isArray(product.images) && product.images.length > 0
            ? product.images[0]
            : '/placeholder-image.webp')
      }
    };
  }) || [];
};

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token, user } = getState().auth;
      if (!token || !user) return { items: [], total: 0 };

  setAuthToken(token);
  const response = await api.get('/api/cart', { params: { userId: user._id } });

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

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1 }, { getState, rejectWithValue }) => {
    try {
      const { token, user } = getState().auth;
      if (!token || !user) return rejectWithValue('User not authenticated');
      if (!productId) return rejectWithValue('Product ID required');

  setAuthToken(token);
  await api.post('/api/cart/add', { productId, quantity, userId: user._id });

      return { productId, quantity };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add item');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId, { getState, rejectWithValue }) => {
    try {
      const { token, user } = getState().auth;

  setAuthToken(token);
  await api.delete(`/api/cart/remove/${itemId}`, { params: { userId: user._id } });

      return itemId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove item');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { getState, rejectWithValue }) => {
    try {
      const { token, user } = getState().auth;

  setAuthToken(token);
  const state = getState();
  const cartItem = state.cart.items.find(i => i._id === itemId || i.product._id === itemId);
  if (!cartItem) return rejectWithValue('Cart item not found');

  const minQty = cartItem.product?.minimumOrderQuantity && cartItem.product.minimumOrderQuantity > 0 ? cartItem.product.minimumOrderQuantity : 1;
  const stock = typeof cartItem.product?.quantity === 'number' ? cartItem.product.quantity : 0;
  const appMax = 10;
  const maxAllowed = Math.min(stock > 0 ? stock : appMax, appMax);

  if (stock <= 0) return rejectWithValue('Product is out of stock');
  if (quantity < minQty) return rejectWithValue(`Minimum order quantity is ${minQty}`);
  if (quantity > maxAllowed) return rejectWithValue(`Maximum available quantity is ${maxAllowed}`);

  await api.put(`/api/cart/update/${itemId}`, { quantity, userId: user._id });

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
      .addCase(clearCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.lastUpdated = new Date().toISOString();
        state.isInCart = {};
      })
      .addCase(clearCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
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
