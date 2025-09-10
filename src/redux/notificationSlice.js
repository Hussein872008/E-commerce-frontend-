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

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
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
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastFetched: null,
  toastNotifications: [],
  highlightedOrderId: null,
  lastNotification: null,
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
    setHighlightedOrder: (state, action) => {
      state.highlightedOrderId = action.payload;
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
      
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n._id === action.meta.arg);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.read = true;
        });
        state.unreadCount = 0;
      });
  }
});

let initialized = false;
let currentSocket = null;

export const initializeNotifications = (userId) => (dispatch) => {
  if (initialized) {
    if (currentSocket && currentSocket.userId !== userId) {
      currentSocket.disconnect();
      initialized = false;
    } else {
      return;
    }
  }
  
  import('../utils/socket').then(module => {
    currentSocket = module.initializeSocket(dispatch);
  });
  
  if (currentSocket) {
    currentSocket.userId = userId;
    
    const reconnectInterval = setInterval(() => {
      if (!currentSocket.connected) {
        currentSocket.connect();
      }
    }, 5000);

    return () => {
      clearInterval(reconnectInterval);
      if (currentSocket) {
        currentSocket.disconnect();
      }
    };
  }

  initialized = true;

  import('../utils/socket').then(module => {
    const socket = module.initializeSocket();
    currentSocket = socket;
  });
  currentSocket.userId = userId;

  if (socket.connected) {
    socket.emit('join', userId);
  }

  socket.on('initialNotifications', ({ notifications, unreadCount }) => {
    if (notifications) {
      dispatch(updateNotifications(notifications));
    }
    if (typeof unreadCount === 'number') {
      dispatch(updateUnreadCount(unreadCount));
    }
  });

  socket.on('notificationUpdate', ({ newNotification, unreadCount }) => {
    if (newNotification) {
      dispatch(addNotification(newNotification));
      
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(() => {});
    }
    
    if (typeof unreadCount === 'number') {
      dispatch(updateUnreadCount(unreadCount));
    }
  });

  socket.on('connect', () => {
    socket.emit('join', userId);
    dispatch(fetchNotifications());
  });

  socket.on('disconnect', (reason) => {
  console.warn('Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      socket.connect();
    }
  });

  dispatch(fetchNotifications());

  return () => {
    if (currentSocket) {
      currentSocket.off('initialNotifications');
      currentSocket.off('notificationUpdate');
      currentSocket.off('connect');
      currentSocket.off('disconnect');
      currentSocket = null;
    }
    initialized = false;
  };
};

export const refreshNotifications = () => (dispatch) => {
  dispatch(fetchNotifications());
};

const slice = createNotificationSlice();
export const { addNotification, updateUnreadCount, clearNotifications, removeToastNotification, setHighlightedOrder } = slice.actions;
export default slice.reducer;
