import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import cartReducer from './cart.slice';
import wishlistReducer from './wishlist.slice';
import ordersReducer from './orders.slice';
import productReducer from './productSlice';
import adminReducer from './adminSlice';
import themeReducer from './themeSlice';
import { createNotificationSlice } from './notificationSlice';

const notificationReducer = createNotificationSlice().reducer;

const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    wishlist: wishlistReducer,
    cart: cartReducer,
    orders: ordersReducer,
    admin: adminReducer,
    theme: themeReducer,
    notifications: notificationReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;