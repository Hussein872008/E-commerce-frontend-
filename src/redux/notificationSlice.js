import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/notifications');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const subscribeToProduct = createAsyncThunk(
  'notifications/subscribeToProduct',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/notifications/subscriptions/subscribe', { productId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const unsubscribeFromProduct = createAsyncThunk(
  'notifications/unsubscribeFromProduct',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/notifications/subscriptions/unsubscribe/${productId}`);
      return { productId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchSubscriptionsForUser = createAsyncThunk(
  'notifications/fetchSubscriptionsForUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/notifications/subscriptions/my-subscriptions');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || { message: String(error) });
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.patch('/api/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || { message: String(error) });
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
    subscriptions: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  toastNotifications: [],
  lastNotification: null,
  pendingReadIds: [],
  isConnected: false
};

export const createNotificationSlice = () => createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const notification = action.payload;
      const exists = state.notifications.some(n => n._id === notification._id);
      
      if (!exists) {
        state.notifications.unshift(notification);
    state.lastNotification = notification;
        
        if (!notification.read) {
          state.unreadCount += 1;
          
          if (!state.toastNotifications.some(n => n._id === notification._id)) {
            state.toastNotifications.push({
              ...notification,
              timestamp: new Date().toISOString(),
              isNew: true
            });
          }
          

          try {
            const audio = new Audio(notification.type === 'order' ? '/new-order.mp3' : '/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch (error) {}
        }
      }
    },
    updateUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    removeToastNotification: (state, action) => {
      state.toastNotifications = state.toastNotifications.filter(
        notification => notification._id !== action.payload
      );
    },

    updateNotifications: (state, action) => {
      state.notifications = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        const existingIds = new Set(state.notifications.map(n => n._id));
        const newNotifications = action.payload.notifications.filter(n => !existingIds.has(n._id));
        
        if (newNotifications.length > 0) {
          state.notifications = [...newNotifications, ...state.notifications];
          newNotifications
            .filter(n => !n.read)
            .forEach(n => {
              if (!state.toastNotifications.find(t => t._id === n._id)) {
                state.toastNotifications.push(n);
              }
            });
        }
        
        state.unreadCount = action.payload.notifications.filter(n => !n.read).length;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch notifications';
      })
      
      .addCase(markNotificationAsRead.pending, (state, action) => {

        const id = action.meta.arg;
        if (!id) return;
        const notification = state.notifications.find(n => n._id === id);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }

        if (!state.pendingReadIds.includes(id)) state.pendingReadIds.push(id);

        state.toastNotifications = state.toastNotifications.filter(t => t._id !== id);
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const id = action.meta.arg;

        state.pendingReadIds = state.pendingReadIds.filter(x => x !== id);

        state.toastNotifications = state.toastNotifications.filter(t => t._id !== id);
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        const id = action.meta.arg;

        try {
          const notification = state.notifications.find(n => n._id === id);
          if (notification && notification.read) {
            notification.read = false;
            state.unreadCount = state.unreadCount + 1;
          }
        } catch (e) {}
        state.pendingReadIds = state.pendingReadIds.filter(x => x !== id);
      })
      
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.read = true;
        });
        state.unreadCount = 0;
      })
      .addCase(subscribeToProduct.fulfilled, (state, action) => {
        if (action.payload && action.payload.subscription) {
          state.subscriptions.push(action.payload.subscription);
        }
      })
      .addCase(unsubscribeFromProduct.fulfilled, (state, action) => {
        const pid = action.payload?.productId;
        if (pid) {
          state.subscriptions = state.subscriptions.filter(s => s.product?._id !== pid && String(s.product) !== String(pid));
        }
      })
      .addCase(fetchSubscriptionsForUser.fulfilled, (state, action) => {
        state.subscriptions = action.payload.subscriptions || [];
      });
  }
});

let initialized = false;
let currentSocket = null;

export const initializeNotifications = (userId) => {
  return async (dispatch) => {
    if (initialized) {
      if (currentSocket && currentSocket.userId !== userId) {
        currentSocket.disconnect();
        initialized = false;
      } else {
        return () => {};
      }
    }

    const module = await import('../utils/socket');
    const socket = module.initializeSocket(dispatch);
    currentSocket = socket;
    currentSocket.userId = userId;

    if (socket.connected) {
      socket.emit('join', userId);
    }

    socket.on('connect', () => {
      socket.emit('join', userId);
      dispatch(fetchNotifications());
    });

    try {
      const token = (() => {
        try { return localStorage.getItem('token'); } catch (e) { return null; }
      })();

      if (token) {
        try {
          await dispatch(fetchNotifications());
        } catch (err) {
          console.warn('[Notifications] Failed to fetch notifications during initialize (likely unauthenticated):', err?.message || err);
        }
      } else {
      }
    } catch (e) {
      console.error('[Notifications] initializeNotifications error:', e);
    }

    initialized = true;

    return () => {
      if (currentSocket) {
        try {
          currentSocket.off('initialNotifications');
          currentSocket.off('unreadCount');
          currentSocket.off('connect');
          currentSocket.off('disconnect');
          currentSocket.disconnect();
        } catch (e) {}
        currentSocket = null;
      }
      initialized = false;
    };
  };
};

export const refreshNotifications = () => (dispatch) => {
  dispatch(fetchNotifications());
};

const slice = createNotificationSlice();
export const { addNotification, updateUnreadCount, clearNotifications, removeToastNotification, updateNotifications } = slice.actions;
export default slice.reducer;
