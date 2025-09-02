import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Helper functions
// تعديل دالة processOrderItems لضمان معالجة البيانات بشكل صحيح
const processOrderItems = (items) => {
    if (!items) return [];

    // Handle different response structures
    if (items.orders) {
        items = items.orders;
    }

    if (!Array.isArray(items)) {
        if (typeof items === 'object' && items !== null) {
            items = [items];
        } else {
            return [];
        }
    }

    return items
        .filter(item => !!item._id) // تجاهل أي طلب ليس له _id
        .map(item => ({
            ...item,
            _id: item._id, // فقط من الباكيند
            trackingNumber: item.trackingNumber || 'Unknown',
            buyer: item.buyer && typeof item.buyer === 'object' ? {
                name: item.buyer.name ? item.buyer.name : 'Unknown',
                email: item.buyer.email ? item.buyer.email : 'Unknown'
            } : { name: 'Unknown', email: 'Unknown' },
            items: Array.isArray(item.items) ? item.items.map(i => ({
                ...i,
                product: i.product ? {
                    ...i.product,
                    _id: i.product._id || null,
                    title: i.product.title || 'Unknown Product',
                    price: i.product.price || 0,
                    image: i.product.image && typeof i.product.image === 'string' && i.product.image.match(/\.(jpg|jpeg|png|webp)$/i)
                        ? i.product.image
                        : '/placeholder-image.webp'
                } : {
                    _id: null,
                    title: 'Deleted Product',
                    price: 0,
                    image: '/placeholder-image.webp'
                }
            })) : []
        }));
};

// Async Thunks
export const fetchOrders = createAsyncThunk(
    'orders/fetchOrders',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { token } = getState().auth;

            if (!token) {
                throw new Error('No authentication token found');
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 ثواني timeout
            };

            const [ordersRes, statsRes] = await Promise.all([
                axios.get('/api/orders/my', config),
                axios.get('/api/orders/my/stats', config)
            ]);

            if (!ordersRes.data || !statsRes.data) {
                throw new Error('Invalid response structure');
            }

            return {
                orders: processOrderItems(ordersRes.data.orders || ordersRes.data),
                stats: statsRes.data.stats || statsRes.data || {
                    total: 0,
                    completed: 0,
                    pending: 0,
                    cancelled: 0
                }
            };

        } catch (error) {
            console.error('API Error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            let errorMessage = 'Failed to fetch orders';
            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = 'Authentication failed, please login again';
                } else if (error.response.data?.error) {
                    errorMessage = error.response.data.error;
                }
            }

            return rejectWithValue(errorMessage);
        }
    }
);

export const createOrder = createAsyncThunk(
    'orders/createOrder',
    async (orderData, { getState, rejectWithValue }) => {
        try {
            const { token } = getState().auth;
            const response = await axios.post('/api/orders/create', orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.order;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'فشل في إنشاء الطلب');
        }
    }
);



export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId, { getState, rejectWithValue }) => {
    try {
    // ...existing code...
      const { token } = getState().auth;
      const response = await axios.put(`/api/orders/cancel/${orderId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    // ...existing code...
      return orderId;
    } catch (error) {
      console.error('Cancel error:', error.response?.data); // إضافة للتحقق
      return rejectWithValue(error.response?.data?.error || 'Failed to cancel order');
    }
  }
);

export const fetchOrderDetails = createAsyncThunk(
    'orders/fetchOrderDetails',
    async (orderId, { getState, rejectWithValue }) => {
        try {
            const { token } = getState().auth;
            const response = await axios.get(`/api/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return processOrderItems([response.data])[0];
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'فشل في جلب تفاصيل الطلب');
        }
    }
);

export const searchOrders = createAsyncThunk(
    'orders/searchOrders',
    async (searchParams, { getState, rejectWithValue }) => {
        try {
            const { token } = getState().auth;
            const response = await axios.get('/api/orders/search', {
                params: searchParams,
                headers: { Authorization: `Bearer ${token}` }
            });
            return {
                orders: processOrderItems(response.data.orders || []),
                total: response.data.total || 0,
                pages: response.data.pages || 1
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'فشل في البحث عن الطلبات');
        }
    }
);

const ordersSlice = createSlice({
    name: 'orders',
    initialState: {
        items: [],
        stats: { total: 0, completed: 0, pending: 0, cancelled: 0 },
        pagination: { total: 0, pages: 1, currentPage: 1 },
        currentOrder: null,
        loading: false,
        error: null,
        creating: false,
        createError: null,
        cancelling: false,
        cancelError: null
    },
    reducers: {
        clearCurrentOrder: (state) => {
            state.currentOrder = null;
        },
        resetOrderErrors: (state) => {
            state.error = null;
            state.createError = null;
            state.cancelError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.orders;
                state.stats = action.payload.stats;
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(createOrder.pending, (state) => {
                state.creating = true;
                state.createError = null;
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.creating = false;
                state.items.unshift(action.payload);
                state.stats.total += 1;
                state.stats.pending += 1;
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.creating = false;
                state.createError = action.payload;
            })

            .addCase(cancelOrder.pending, (state) => {
                state.cancelling = true;
                state.cancelError = null;
            })
            .addCase(cancelOrder.fulfilled, (state, action) => {
                state.cancelling = false;
                const index = state.items.findIndex(order => order._id === action.payload);
                if (index !== -1) {
                    state.items[index].status = 'Cancelled';
                    state.stats.cancelled += 1;
                    state.stats.pending -= 1;
                }
            })
            .addCase(cancelOrder.rejected, (state, action) => {
                state.cancelling = false;
                state.cancelError = action.payload;
            })

            .addCase(fetchOrderDetails.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrderDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.currentOrder = action.payload;
            })
            .addCase(fetchOrderDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(searchOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(searchOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.orders;
                state.pagination = {
                    total: action.payload.total,
                    pages: action.payload.pages,
                    currentPage: action.meta.arg.page || 1
                };
            })
            .addCase(searchOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearCurrentOrder, resetOrderErrors } = ordersSlice.actions;
export default ordersSlice.reducer;

export const selectOrders = (state) => state.orders.items;
export const selectOrdersStats = (state) => state.orders.stats;
export const selectCurrentOrder = (state) => state.orders.currentOrder;
export const selectOrdersLoading = (state) => state.orders.loading;
export const selectOrdersError = (state) => state.orders.error;
export const selectOrderCreating = (state) => state.orders.creating;
export const selectOrderCreateError = (state) => state.orders.createError;
export const selectOrderCancelling = (state) => state.orders.cancelling;
export const selectOrderCancelError = (state) => state.orders.cancelError;
