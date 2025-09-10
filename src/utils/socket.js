import { io } from 'socket.io-client';
import store from '../redux/store';
import { addNotification, updateUnreadCount } from '../redux/notificationSlice';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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
    socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      const userId = store.getState().auth.user?._id;
      if (userId) {
        socket.emit('join', userId);
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
      
      const { newNotification, unreadCount } = data;
      
      if (newNotification) {
        handleNotification(newNotification, dispatch);
      }
      
      if (typeof unreadCount === 'number') {
        dispatch(updateUnreadCount(unreadCount));
      }
    });

    socket.on('newNotification', (notification) => {
      handleNotification(notification, dispatch);
    });

    socket.on('newOrder', (orderData) => {
      const notification = {
        type: 'order',
        message: `طلب جديد: ${orderData.orderNumber}`,
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
