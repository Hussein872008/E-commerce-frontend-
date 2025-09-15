import { useEffect, useRef, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  setHighlightedOrder,
  refreshNotifications
} from '../redux/notificationSlice';
import { FiCheck, FiPackage, FiShoppingCart, FiAlertCircle, FiX } from 'react-icons/fi';
import NotificationHandler from './NotificationHandler';



const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'order':
      return <FiShoppingCart className="text-green-500" />;
    case 'product':
    case 'product-available':
      return <FiPackage className="text-blue-500" />;
    default:
      return <FiAlertCircle className="text-yellow-500" />;
  }
};

const getNotificationLink = (notification) => {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { user = null; }
  const role = user && (user.role || user.roles) ? (user.role || (Array.isArray(user.roles) ? user.roles[0] : user.roles)) : null;

  if ((notification.type === 'product-available' || notification.type === 'product') && notification.relatedId) {
    if (notification.type === 'product') {
      return { pathname: `/seller/my-products`, search: `?highlight=${notification.relatedId}` };
    }

    return { pathname: `/product/${notification.relatedId}`, search: '' };
  }

  if (notification.type === 'order') {
    const basePath = (role === 'buyer' || role === 'user') ? '/buyer' : '/seller';
    return {
      pathname: `${basePath}/orders`,
      search: `?highlight=${notification.relatedId}`
    };
  }

  
  return { pathname: '/seller', search: '' };
};

const NotificationsPanel = memo(({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const panelRef = useRef(null);
  
  const { notifications, unreadCount, isLoading, lastNotification } = useSelector(state => state.notifications);
  const authToken = useSelector(state => state.auth.token);
  const isDarkMode = useSelector(state => state.theme.darkMode);

  const handleMarkAsRead = useCallback((id) => {
    dispatch(markNotificationAsRead(id));
  }, [dispatch]);

  const handleMarkAllAsRead = useCallback(() => {
    dispatch(markAllNotificationsAsRead());
  }, [dispatch]);

  const handleNotificationClick = useCallback((notification) => {
    onClose();
    handleMarkAsRead(notification._id);
    
    const { pathname, search } = getNotificationLink(notification);
    
    if (notification.relatedId) {
      dispatch(setHighlightedOrder(notification.relatedId));
    }
    
    navigate(pathname + search);
  }, [dispatch, navigate, onClose, handleMarkAsRead]);

  const refreshNotificationsData = useCallback(() => {
    dispatch(refreshNotifications());
  }, [dispatch]);

  const renderedNotifications = (notifications || []).map((notification, idx) => {
    const idPart = notification?._id && String(notification._id).trim();
    const relatedPart = notification?.relatedId && String(notification.relatedId).trim();
    const datePart = notification?.createdAt && String(notification.createdAt).trim();
    let baseKey = `n-${idPart || relatedPart || datePart || idx}`;
    return { ...notification, _renderKeyBase: baseKey, _originalIndex: idx };
  });

  const seen = new Set();
  renderedNotifications.forEach((n) => {
    let key = n._renderKeyBase;
    if (seen.has(key)) {
      key = `${key}-${n._originalIndex}`;
    }
    seen.add(key);
    n._renderKey = key;
  });

  useEffect(() => {
    if (!authToken) {
      console.info('[NotificationsPanel] Skipping refresh — no auth token');
      return;
    }

    refreshNotificationsData();

    const interval = setInterval(() => {
      refreshNotificationsData();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshNotificationsData]);

  useEffect(() => {
    if (isOpen && authToken) {
      refreshNotificationsData();
    }
    if (isOpen && !authToken) {
      console.info('[NotificationsPanel] Panel opened but no auth token — skipping fetch');
    }
  }, [isOpen, refreshNotificationsData]);



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={onClose}
            />

            <motion.div
              key="panel"
              ref={panelRef}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`fixed right-4 top-20 w-full max-w-sm rounded-2xl shadow-2xl z-50 ${
                isDarkMode
                  ? 'bg-gray-900 border border-gray-800'
                  : 'bg-white'
              }`}
            >
              <div className={`p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-500 text-white">
                        {unreadCount}
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode
                        ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FiX />
                  </button>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className={`mt-2 text-sm flex items-center gap-1 transition-colors ${
                      isDarkMode
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    <FiCheck className="text-lg" />
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {isLoading ? (
                  <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No notifications yet
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    <AnimatePresence>
                      {renderedNotifications.map((notification) => {
                        const key = notification._renderKey;
                        return (
                          <motion.div
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            key={key}
                            onClick={() => handleNotificationClick(notification)}
                            className={`relative p-4 transition-colors cursor-pointer ${
                              !notification.read
                                ? isDarkMode
                                  ? 'bg-blue-900/20 border-l-4 border-blue-500'
                                  : 'bg-blue-50 border-l-4 border-blue-500'
                                : isDarkMode
                                  ? 'bg-gray-800/30'
                                  : 'bg-gray-50'
                            } ${
                              isDarkMode
                                ? 'hover:bg-gray-800/50'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              {!notification.read && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-md"></div>
                              )}
                              <div className={`mt-1 p-2 rounded-full ${
                                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                              }`}>
                                <NotificationIcon type={notification.type} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notification.read 
                                  ? isDarkMode 
                                    ? 'text-white font-semibold' 
                                    : 'text-gray-900 font-semibold'
                                  : isDarkMode 
                                    ? 'text-gray-300' 
                                    : 'text-gray-600'
                                }`}>
                                    {notification.message}
                                </p>
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="flex-shrink-0 self-center">
                                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" title="Unread"></div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <NotificationHandler 
        notification={lastNotification} 
      />
    </>
  );
});

export default NotificationsPanel;
