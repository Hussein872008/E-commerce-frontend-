import { io } from 'socket.io-client';
import store from '../redux/store';
import { addNotification, updateUnreadCount, updateNotifications } from '../redux/notificationSlice';
import { normalizeUser, resolveUserId } from './user';

const rawApiBase = import.meta.env.VITE_API_BASE_URL;
const rawSocketBase = import.meta.env.VITE_SOCKET_URL;

const API_BASE = rawApiBase ? String(rawApiBase).replace(/\/$/, '') : (typeof window !== 'undefined' ? window.location.origin : import.meta.env.VITE_API_BASE_URL);
const recentNotificationIds = new Map();

const PRUNE_AFTER_MS = 15 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [id, ts] of recentNotificationIds.entries()) {
    if (now - ts > PRUNE_AFTER_MS) recentNotificationIds.delete(id);
  }
}, PRUNE_AFTER_MS);

let SOCKET_URL;
if (rawSocketBase) {
  SOCKET_URL = String(rawSocketBase).replace(/\/$/, '');
} else if (rawApiBase) {
  SOCKET_URL = API_BASE;
} else if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  SOCKET_URL = import.meta.env.VITE_API_BASE_URL;
} else {
  SOCKET_URL = API_BASE;
}

let socket;

const handleNotification = (newNotification, dispatch) => {
  if (!newNotification) return;


  dispatch(addNotification({
    ...newNotification,
    isNew: true
  }));
};

export const initializeSocket = (dispatch) => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  if (!socket) {
    const token = store.getState().auth.token;
    socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      if (process.env.NODE_ENV !== 'production') {
        const shortId = socket.id ? (String(socket.id).slice(-8)) : 'unknown';
      }
  const userId = resolveUserId(store.getState().auth.user);
  if (userId) {
        if (process.env.NODE_ENV !== 'production') {
          const shortUser = String(userId).slice(-6);
        }
        socket.emit('join', userId);
      } else {
        if (process.env.NODE_ENV !== 'production') {} 
      }
    });

    socket.on('connect_error', (error) => {
  console.error('Socket.IO Connection Error:', error);
      setTimeout(() => socket.connect(), 1000);
    });

    socket.on('disconnect', (reason) => {
  console.warn('Socket.IO Disconnected:', reason);
      if (reason === 'io server disconnect') {
        setTimeout(() => socket.connect(), 1000);
      }
    });

    socket.on('unreadCount', (count) => {
      if (process.env.NODE_ENV !== 'production') {
      }
      if (typeof count === 'number') dispatch(updateUnreadCount(count));
    });

    socket.on('newNotification', (notification) => {
      if (process.env.NODE_ENV !== 'production') {
      }
      try {
        const id = notification && (notification._id || notification.relatedId);
        if (id) {
          if (recentNotificationIds.has(id)) return;
          recentNotificationIds.set(id, Date.now());
        }
      } catch (e) {}
      handleNotification(notification, dispatch);
    });

    socket.on('initialNotifications', (notifications) => {
      try {
        if (!Array.isArray(notifications)) return;
        dispatch(updateNotifications(notifications));
        const unread = notifications.filter(n => !n.read).length;
        dispatch(updateUnreadCount(unread));
        if (process.env.NODE_ENV !== 'production');
      } catch (e) {
        console.error('[Socket] failed to apply initialNotifications', e);
      }
    });

  socket.on('newOrder', (orderData) => {
      try {
        if (orderData && orderData.notification && orderData.notification._id) {
          handleNotification(orderData.notification, dispatch);
          return;
        }
      } catch (e) {}


      const notification = {
        type: 'order',
        message: `New Order: #${orderData.order?._id?.substring(0, 8) || 'N/A'}`,
        data: orderData,
        read: false,
        createdAt: new Date().toISOString(),
        _id: Date.now().toString(),
        relatedId: orderData.order?._id
      };
    
      handleNotification(notification, dispatch);
    });
    

    socket.on('notification.created', (notification) => {
      if (process.env.NODE_ENV !== 'production');
      try {
        const id = notification && (notification._id || notification.relatedId);
        if (id) {
          if (recentNotificationIds.has(id)) return;
          recentNotificationIds.set(id, Date.now());
        }
      } catch (e) {}
      handleNotification(notification, dispatch);
    });

    socket.on('notification.unreadCount', (count) => {
      if (process.env.NODE_ENV !== 'production');
      if (typeof count === 'number') dispatch(updateUnreadCount(count));
    });

    if (process.env.NODE_ENV !== 'production') {
      ['unreadCount', 'highlightOrder', 'initialNotifications', 'notification.created', 'notification.unreadCount'].forEach(event => {
        socket.on(event, (data) => {});
      });
    }
  }

  return socket;
};

export default socket;

try {
  if (typeof window !== 'undefined') {
    window.__socketDebugger = window.__socketDebugger || {};

    window.__socketDebugger.initialize = (dispatch) => {
      try {
        const module = require('../utils/socket');
      } catch (e) {
      }
      const s = initializeSocket(dispatch || (store && store.dispatch));
      if (process.env.NODE_ENV !== 'production') ;
      return s;
    };

    window.__socketDebugger.getSocket = () => socket;

    window.__socketDebugger.getStatus = () => {
      const auth = store.getState().auth || null;
      return {
        connected: !!(socket && socket.connected),
        id: socket && (socket.id ? String(socket.id).slice(-8) : null),
        auth: auth ? { user: auth.user ? { _id: auth.user._id ? String(auth.user._id).slice(-6) : null, name: auth.user.name } : null } : null
      };
    };

    window.__socketDebugger.listRoomSockets = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!token || !user) throw new Error('No token or user in localStorage');
        const userId = resolveUserId(user);
        const res = await fetch(`${API_BASE}/api/debug/room/${userId}/sockets`, {
          method: 'GET',
          headers: { Authorization: 'Bearer ' + token }
        });
        return await res.json();
      } catch (err) {
        console.error('[__socketDebugger] listRoomSockets error', err);
        throw err;
      }
    };

    window.__socketDebugger.sendTestOrderDelivered = async (orderId) => {
      try {
  const token = localStorage.getItem('token');
  const raw = JSON.parse(localStorage.getItem('user') || 'null');
  const user = raw ? normalizeUser(raw) : null;
  if (!token || !user) throw new Error('No token or user in localStorage');
  const userId = resolveUserId(user);
  const body = { recipientId: userId, orderId: orderId || ('TEST_ORDER_' + Date.now()) };
        const res = await fetch(`${API_BASE}/api/debug/order-delivered`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify(body)
        });
        return await res.json();
      } catch (err) {
        console.error('[__socketDebugger] sendTestOrderDelivered error', err);
        throw err;
      }
    };
  }
} catch (e) {
}
