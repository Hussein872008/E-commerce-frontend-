import { io } from 'socket.io-client';
import store from '../redux/store';
import { addNotification, updateUnreadCount } from '../redux/notificationSlice';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL;

let socket;

const handleNotification = (newNotification, dispatch) => {
  if (!newNotification) return;

    
  dispatch(addNotification({ 
    ...newNotification, 
    isNew: true 
  }));
  
  try {
    const audio = new Audio(newNotification.type === 'order' ? '/new-order.mp3' : '/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (error) {
  console.warn('Could not play notification sound:', error);
  }
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
      console.info('[Socket] connected', socket.id);
      const userId = store.getState().auth.user?._id;
      if (userId) {
        console.info('[Socket] emitting join for user', userId);
        socket.emit('join', userId);
      } else {
        console.info('[Socket] no authenticated user to join room');
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

    socket.on('notificationUpdate', (data) => {
      console.info('[Socket] notificationUpdate received', data && data.newNotification ? data.newNotification._id : null, data && data.unreadCount);
      const { newNotification, unreadCount } = data || {};
      if (newNotification) {
        handleNotification(newNotification, dispatch);
      }
      if (typeof unreadCount === 'number') {
        dispatch(updateUnreadCount(unreadCount));
      }
    });

    socket.on('newNotification', (notification) => {
      console.info('[Socket] newNotification received', notification && (notification._id || notification.relatedId));
      handleNotification(notification, dispatch);
    });

    socket.on('newOrder', (orderData) => {
      const notification = {
        type: 'order',
        message: `New Order: ${orderData.orderNumber}`,
        data: orderData,
        read: false,
        createdAt: new Date().toISOString(),
        _id: Date.now().toString(),
        relatedId: orderData._id
      };
      handleNotification(notification, dispatch);
    });
    
    setInterval(() => {
      if (!socket.connected) {
        socket.connect();
      }
    }, 3000);

    if (process.env.NODE_ENV !== 'production') {
      ['notificationUpdate', 'highlightOrder', 'initialNotifications'].forEach(event => {
        socket.on(event, (data) => {
        });
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
      console.info('[__socketDebugger] initialize called, socket:', s && s.id);
      return s;
    };

    window.__socketDebugger.getSocket = () => socket;

    window.__socketDebugger.getStatus = () => {
      return {
        connected: !!(socket && socket.connected),
        id: socket && socket.id,
        auth: store.getState().auth || null
      };
    };

    window.__socketDebugger.listRoomSockets = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!token || !user) throw new Error('No token or user in localStorage');
        const userId = user.id || user._id;
        const res = await fetch(`http://localhost:5000/api/debug/room/${userId}/sockets`, {
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
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!token || !user) throw new Error('No token or user in localStorage');
        const userId = user.id || user._id;
        const body = { recipientId: userId, orderId: orderId || ('TEST_ORDER_' + Date.now()) };
        const res = await fetch('http://localhost:5000/api/debug/order-delivered', {
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
