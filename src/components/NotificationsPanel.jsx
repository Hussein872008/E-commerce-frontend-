import { useEffect, useRef, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  refreshNotifications
} from '../redux/notificationSlice';
import { getNotificationLink } from '../utils/notificationLink';
import { fetchFilteredProducts } from '../redux/productSlice';
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


const NotificationsPanel = memo(({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const panelRef = useRef(null);

  const { notifications, unreadCount, isLoading, lastNotification } = useSelector(
    (state) => state.notifications
  );
  const authToken = useSelector((state) => state.auth.token);
  const isDarkMode = useSelector((state) => state.theme.darkMode);

  const handleMarkAsRead = useCallback(
    (id) => {
      dispatch(markNotificationAsRead(id));
    },
    [dispatch]
  );

  const handleMarkAllAsRead = useCallback(() => {
    dispatch(markAllNotificationsAsRead());
  }, [dispatch]);

  const handleNotificationClick = useCallback(
    async (notification) => {
      onClose();
        const token = (() => { try { return localStorage.getItem('token'); } catch (e) { return null; } })();
        if (notification._id && token) {
          handleMarkAsRead(notification._id);
        }

      let user = null;
      try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { user = null; }
      const role = user && (user.role || user.roles) ? (user.role || (Array.isArray(user.roles) ? user.roles[0] : user.roles)) : null;

      const { pathname, search, related } = getNotificationLink(notification);

      const appendHighlight = (basePath, baseSearch, relatedId) => {
        try {
          const params = new URLSearchParams(baseSearch || '');
          if (relatedId && !String(basePath).startsWith('/product/')) params.set('highlight', relatedId);
          const s = params.toString();
          return basePath + (s ? `?${s}` : '');
        } catch (e) {
          return basePath + (baseSearch || '');
        }
      };

      let finalPath = (pathname || '/') + (search || '');
      if (notification.type === 'order') {
        const base = role === 'buyer' || role === 'user' ? '/buyer/orders' : '/seller/orders';
        finalPath = appendHighlight(base, search || '', related);
      } else if (notification.type === 'product' || notification.type === 'product-available') {
        if (role === 'buyer' || role === 'user') {
          let resolved = related || notification.relatedId || notification.productId || (notification.data && (notification.data.product && (notification.data.product._id || notification.data.product.id))) || (notification.data && notification.data.productId) || null;
          if (!resolved) {
            try {
              const s = JSON.stringify(notification || {});
              const excludeSet = new Set();
              if (notification && notification._id) excludeSet.add(String(notification._id));
              const addMaybe = (v) => {
                try {
                  if (!v) return;
                  if (typeof v === 'string') excludeSet.add(String(v));
                  else if (typeof v === 'object') {
                    if (v._id) excludeSet.add(String(v._id));
                    if (v.id) excludeSet.add(String(v.id));
                  }
                } catch (e) {}
              };
              addMaybe(notification && notification.recipient);
              addMaybe(notification && notification.buyer);
              addMaybe(notification && notification.seller);
              addMaybe(notification && notification.user);
              addMaybe(notification && notification.author);

              for (const mm of s.matchAll(/([0-9a-fA-F]{24})/g)) {
                if (mm && mm[1]) {
                  if (excludeSet.has(String(mm[1]))) continue;
                  resolved = mm[1];
                  break;
                }
              }

              if (!resolved && (notification.type === 'product-available' || notification.type === 'product')) {
                let user = null;
                try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { user = null; }
                const role = user && (user.role || user.roles) ? (user.role || (Array.isArray(user.roles) ? user.roles[0] : user.roles)) : null;
                if (role === 'buyer') {
                  let title = null;
                  try { const m = (notification && notification.message) ? notification.message.match(/"([^"]+)"/) : null; if (m && m[1]) title = m[1]; } catch (e) {}
                  if (!title && notification && notification.message) {
                    const ms = notification.message.split('is now')[0] || notification.message.split('(')[0] || notification.message;
                    title = ms.replace(/^Product\s+[:"']?/i, '').trim();
                  }
                  if (title) {
                    try {
                      const res = await dispatch(fetchFilteredProducts({ page: 1, limit: 10, search: title, fields: '_id,title' }));
                      if (fetchFilteredProducts.fulfilled.match(res)) {
                        const payload = res.payload || {};
                        const products = Array.isArray(payload.products) ? payload.products : (Array.isArray(payload.data) ? payload.data : []);
                        if (products && products.length) {
                          resolved = String(products[0]._id);
                        }
                      }
                    } catch (e) {}
                  }
                }
              }
            } catch (e) {}
          }
          if (resolved) {
            finalPath = appendHighlight(`/product/${resolved}`, '', resolved);
          } else {
            finalPath = appendHighlight('/store', '', null);
          }
        } else {
          const baseSearch = search || (() => {
            const p = new URLSearchParams();
            p.set('open', 'stockAlerts');
            if (related) p.set('highlight', related);
            return `?${p.toString()}`;
          })();
          finalPath = appendHighlight(`/seller`, baseSearch, related);
        }
      } else {
        finalPath = appendHighlight(pathname || '/', search || '', related);
      }

      try { /* Notification clicked */ } catch (e) {}

      if (!token) {
        const redirectTo = encodeURIComponent(finalPath || '/');
        navigate(`/login?redirect=${redirectTo}`);
        return;
      }

      navigate(finalPath);
    },
    [dispatch, navigate, onClose, handleMarkAsRead]
  );

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
    if (!authToken) return;

    refreshNotificationsData();
    const rootEl = document.documentElement;
    rootEl.setAttribute('data-notifications-panel-open', 'true');

    const interval = setInterval(() => {
      refreshNotificationsData();
    }, 120000);

    return () => {
      clearInterval(interval);
      rootEl.removeAttribute('data-notifications-panel-open');
    };
  }, [refreshNotificationsData, authToken]);

  useEffect(() => {
    if (isOpen && authToken) {
      refreshNotificationsData();
    }
  }, [isOpen, refreshNotificationsData, authToken]);

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
              className={`fixed top-12 sm:top-20 right-0 sm:right-4 left-0 sm:left-auto w-full sm:w-auto sm:max-w-sm z-50 rounded-t-xl sm:rounded-2xl shadow-2xl ${
                isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'
              }`}
            >
              <div className={`px-3 py-2 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <h3
                    className={`text-base sm:text-lg font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white">
                        {unreadCount}
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={onClose}
                    className={`p-1.5 rounded-lg transition-colors ${
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
                    <FiCheck className="text-base" />
                    <span className="text-sm">Mark all as read</span>
                  </button>
                )}
              </div>

              <div className="max-h-[65vh] overflow-y-auto">
                {isLoading ? (
                  <div className={`p-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className={`p-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ duration: 0.2 }}
                            key={key}
                            onClick={() => handleNotificationClick(notification)}
                            className={`relative p-3 transition-colors cursor-pointer ${
                              !notification.read
                                ? isDarkMode
                                  ? 'bg-blue-900/20 border-l-3 border-blue-500'
                                  : 'bg-blue-50 border-l-3 border-blue-500'
                                : isDarkMode
                                ? 'bg-gray-800/25'
                                : 'bg-gray-50'
                            } ${isDarkMode ? 'hover:bg-gray-800/45' : 'hover:bg-gray-50'}`}
                            style={{ paddingRight: 48 }}
                          >
                        <div className="flex items-start gap-3">
                              {!notification.read && (
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-md"></div>
                              )}
                              <div className={`mt-0.5 p-1.5 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <NotificationIcon type={notification.type} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${!notification.read ? (isDarkMode ? 'text-white font-semibold' : 'text-gray-900 font-semibold') : (isDarkMode ? 'text-gray-300' : 'text-gray-600')}`}>{notification.message}</p>
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notification?.createdAt ? (() => { try { return format(new Date(notification.createdAt), 'MMM d, h:mm a'); } catch { return 'Just now'; } })() : 'Just now'}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  {notification.priority && (
                                    <span className={`px-2 py-0.5 text-[11px] rounded-full font-semibold ${notification.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300' : notification.priority === 'low' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>{String(notification.priority).toUpperCase()}</span>
                                  )}
                                  {notification.channels && Array.isArray(notification.channels) && notification.channels.length > 0 && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500">{notification.channels.join(', ')}</span>
                                  )}
                                </div>
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

      <NotificationHandler notification={lastNotification} />
    </>
  );
});

export default NotificationsPanel;
