import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAuthToken } from '../utils/api';

const processOrderItems = (items) => {
    if (!items) return [];

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

    const normalizeStatus = (raw) => {
        if (!raw && raw !== "") return 'Processing';
        const s = String(raw).trim().toLowerCase();
        if (s === 'processing' || s === 'pending' || s === 'in_progress') return 'Processing';
        if (s === 'shipped' || s === 'in-transit' || s === 'in transit') return 'Shipped';
        if (s === 'delivered' || s === 'completed' || s === 'done') return 'Delivered';
        if (s === 'cancelled' || s === 'canceled' || s === 'cancel') return 'Cancelled';
        return raw;
    };

    return items
        .filter(item => !!item._id) 
        .map(item => ({
            ...item,
            _id: item._id,
            status: normalizeStatus(item.status || item.state || item.statusText || ''),
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

const normalizeStats = (raw = {}) => {
    if (raw && typeof raw === 'object' && ('total' in raw || 'completed' in raw || 'pending' in raw || 'cancelled' in raw)) {
        return {
            total: Number(raw.total) || 0,
            completed: Number(raw.completed) || 0,
            pending: Number(raw.pending) || 0,
            cancelled: Number(raw.cancelled) || 0
        };
    }

    if (raw.orderStatus && typeof raw.orderStatus === 'object') {
        const os = raw.orderStatus;
        const shippedCount = Number(os.Shipped || os.shipped || os.ShippedCount || 0) || 0;
        const completedCount = Number(os.Delivered || os.delivered || os.completed || os.Completed || 0) || 0;
        const pendingCount = (Number(os.Processing || os.processing || os.pending || 0) || 0) + shippedCount;
        const cancelledCount = Number(os.Cancelled || os.cancelled || os.Canceled || 0) || 0;
        const totalCount = Number(raw.total) || completedCount + pendingCount + cancelledCount;
        return {
            total: totalCount || 0,
            completed: completedCount || 0,
            pending: pendingCount || 0,
            cancelled: cancelledCount || 0
        };
    }

    const shipped = Number(raw.shipped || raw.Shipped || 0) || 0;
    const completed = Number(raw.delivered || raw.completed || raw.Delivered || 0) || 0;
    const pending = (Number(raw.processing || raw.pending || 0) || 0) + shipped;
    const cancelled = Number(raw.cancelled || raw.canceled || 0) || 0;
    return {
        total: Number(raw.total) || completed + pending + cancelled,
        completed,
        pending,
        cancelled
    };
};

export const fetchOrders = createAsyncThunk(
    'orders/fetchOrders',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { token } = getState().auth;

            if (!token) {
                throw new Error('No authentication token found');
            }

            setAuthToken(token);

            const config = {
                timeout: 10000 
            };

            const statsConfig = {
                ...config,
                params: { _ts: Date.now() },
                headers: {
                    ...(config.headers || {}),
                    'Cache-Control': 'no-cache',
                    Pragma: 'no-cache'
                }
            };

            const [ordersRes, statsRes] = await Promise.all([
                api.get('/api/orders/my', config),
                api.get('/api/orders/my/stats', statsConfig)
            ]);

            if (!ordersRes.data || !statsRes.data) {
                throw new Error('Invalid response structure');
            }


            return {
                orders: processOrderItems(ordersRes.data.orders || ordersRes.data),
                stats: normalizeStats(statsRes.data.stats || statsRes.data)
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
            setAuthToken(token);
            const response = await api.post('/api/orders/create', orderData);
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
    const { token } = getState().auth;
    setAuthToken(token);
    const response = await api.put(`/api/orders/cancel/${orderId}`, {}, { timeout: 10000 });
      return orderId;
    } catch (error) {
      console.error('Cancel error:', error.response?.data); 
      return rejectWithValue(error.response?.data?.error || 'Failed to cancel order');
    }
  }
);

export const fetchOrderDetails = createAsyncThunk(
    'orders/fetchOrderDetails',
    async (orderId, { getState, rejectWithValue }) => {
        try {
            const { token } = getState().auth;
            setAuthToken(token);
            const response = await api.get(`/api/orders/${orderId}`);
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
            setAuthToken(token);
            const response = await api.get('/api/orders/search', {
                params: searchParams
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
