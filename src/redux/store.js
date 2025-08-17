// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import cartReducer from './cart.slice';
import wishlistReducer from './wishlist.slice';
import ordersReducer from './orders.slice';
import productReducer from './productSlice';
import adminReducer from './adminSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    wishlist: wishlistReducer,
    cart: cartReducer,
    orders: ordersReducer,

    admin: adminReducer


  },
});

export default store;