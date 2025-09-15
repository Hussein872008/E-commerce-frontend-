import { useEffect, memo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addNotification, setHighlightedOrder, markNotificationAsRead } from '../redux/notificationSlice';

const NotificationHandler = memo(({ notification }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleNotificationClick = (notif) => {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { user = null; }
    const role = user && (user.role || user.roles) ? (user.role || (Array.isArray(user.roles) ? user.roles[0] : user.roles)) : null;

    let path = '/seller';
    let search = '';

    if (notif.type === 'order' && notif.relatedId) {
      if (role === 'buyer' || role === 'user') {
        path = `/buyer/orders`;
      } else {
        path = `/seller/orders`;
      }
      search = `?highlight=${notif.relatedId}`;
      dispatch(setHighlightedOrder(notif.relatedId));
    } else if ((notif.type === 'product' || notif.type === 'product-available') && notif.relatedId) {
      path = `/product/${notif.relatedId}`;
      search = '';
    }

    if (notif._id) {
      dispatch(markNotificationAsRead(notif._id));
    }

    navigate(path + search);
  };

  useEffect(() => {
    if (notification && !notification.read && notification.isNew) {
      try {
        const audio = new Audio(notification.type === 'order' ? '/new-order.mp3' : '/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (error) {
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const desktopNotification = new Notification('New Notification', {
            body: notification.message,
            icon: '/logo.png',
            tag: notification._id,
            requireInteraction: true
          });

          desktopNotification.onclick = () => {
            window.focus();
            handleNotificationClick(notification);
          };
        } catch (error) {
        }
      }

      dispatch(addNotification({
        ...notification,
        isToast: true,
        action: {
          label: 'show',
          onClick: () => handleNotificationClick(notification)
        }
      }));
    }
  }, [notification?.read, notification?._id, notification?.message, notification?.type, notification?.relatedId, dispatch, navigate]);

  return null;
});

NotificationHandler.displayName = 'NotificationHandler';

export default NotificationHandler;