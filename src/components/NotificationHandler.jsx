import { useEffect, memo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  markNotificationAsRead,
  removeToastNotification
} from '../redux/notificationSlice';
import { getNotificationLink } from '../utils/notificationLink';
import store from '../redux/store';
import { searchOrders } from '../redux/orders.slice';
import { fetchFilteredProducts } from '../redux/productSlice';

const NotificationHandler = memo(({ notification }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const orders = useSelector(state => state.orders?.items || []);
  const token = (() => {
    try { return localStorage.getItem('token'); } catch (e) { return null; }
  })();


  if (typeof window !== 'undefined' && !window.__GLOBAL_SHOWN_NOTIFS) window.__GLOBAL_SHOWN_NOTIFS = new Set();
  const shownNotifs = useRef(window.__GLOBAL_SHOWN_NOTIFS);

  const handleNotificationClick = async (notif) => {
    try {

    } catch (e) {}
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('user') || 'null');
    } catch (e) {
      user = null;
    }
    const role =
      user && (user.role || user.roles)
        ? user.role || (Array.isArray(user.roles) ? user.roles[0] : user.roles)
        : null;

    const link = getNotificationLink(notif);
    let path = link.pathname || '/store';
    let search = link.search || '';
    let related = link.related || null;

    try {

    } catch (e) {}

try {
      if ((notif.type === 'product-available' || notif.type === 'product') && (!related || path === '/store')) {
        const fallback = notif.relatedId || (notif.meta && notif.meta.originalRelatedId) || notif.related || (notif.data && notif.data.order && notif.data.order._id) || null;
        if (fallback) {
          related = String(fallback);

          if ((notif.type === 'product-available' || notif.type === 'product') && (!related || path === '/store')) {
              try {
              const asString = JSON.stringify(notif || {});
              const excludeSet = new Set();
              if (notif && notif._id) excludeSet.add(String(notif._id));
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
              addMaybe(notif && notif.recipient);
              addMaybe(notif && notif.buyer);
              addMaybe(notif && notif.seller);
              addMaybe(notif && notif.user);
              addMaybe(notif && notif.author);

              let found = null;
              for (const mm of asString.matchAll(/([0-9a-fA-F]{24})/g)) {
                if (mm && mm[1]) {
                  if (excludeSet.has(String(mm[1]))) continue;
                  found = mm[1];
                  break;
                }
              }
              if (found) {
                related = found;
                if (notif.type === 'product-available') {
                  path = `/product/${related}`;
                  search = '';
                } else {
                    const params = new URLSearchParams();
                    params.set('open', 'stockAlerts');
                    params.set('highlight', related);
                    const qty = notif?.data?.quantity ?? notif?.data?.stock ?? notif?.meta?.quantity ?? notif?.meta?.stock;
                    if (typeof qty === 'number') {
                      params.set('severity', qty < 5 ? 'warning' : 'info');
                    } else {
                      params.set('severity', 'warning');
                    }
                    path = `/seller`;
                    search = `?${params.toString()}`;
                }
              } else {
try {
                  if (!related && notif.type === 'product-available' && role === 'buyer') {
                    let title = null;
                    try {
                      const m = (notif && notif.message) ? notif.message.match(/"([^"]+)"/) : null;
                      if (m && m[1]) title = m[1];
                    } catch (e) {}
                    if (!title && notif && notif.message) {
                      const ms = notif.message.split('is now')[0] || notif.message.split('(')[0] || notif.message;
                      title = ms.replace(/^Product\s+[:"']?/i, '').trim();
                    }

                    if (title) {
                      try {
                        const res = await dispatch(fetchFilteredProducts({ page: 1, limit: 10, search: title, fields: '_id,title' }));
                        if (fetchFilteredProducts.fulfilled.match(res)) {
                          const payload = res.payload || {};
                          const products = Array.isArray(payload.products) ? payload.products : (Array.isArray(payload.data) ? payload.data : []);
                          if (products && products.length) {
                            related = String(products[0]._id);
                            path = `/product/${related}`;
                            search = '';
                          }
                        }
                      } catch (e) {}
                    }
                  }
                } catch (e) {}
              }
            } catch (e) {}
          }
          if (notif.type === 'product-available') {
            path = `/product/${related}`;
            search = '';
          } else if (notif.type === 'product') {
            const params = new URLSearchParams();
            params.set('open', 'stockAlerts');
            params.set('highlight', related);
            const qty2 = notif?.data?.quantity ?? notif?.data?.stock ?? notif?.meta?.quantity ?? notif?.meta?.stock;
            if (typeof qty2 === 'number') {
              params.set('severity', qty2 < 5 ? 'warning' : 'info');
            } else {
              params.set('severity', 'warning');
            }
            path = `/seller/dashboard`;
            search = `?${params.toString()}`;
          }
        }
      }
    } catch (e) {}

    try {
      if (related) {
        const params = new URLSearchParams(search || '');
        if (!String(path).startsWith('/product/')) params.set('highlight', related);
        const s = params.toString();
        search = s ? `?${s}` : '';
      }
    } catch (e) {}

    if (notif.type === 'order') {
      if (role === 'buyer' || role === 'user') path = `/buyer/orders`;
      else path = `/seller/orders`;
    }

    const token = (() => {
      try { return localStorage.getItem('token'); } catch (e) { return null; }
    })();

    if (notif._id && token) {
      dispatch(markNotificationAsRead(notif._id));
    }

    if (!token) {
      const redirectTo = encodeURIComponent((path + search) || '/');
      try {} 
      catch (e) {}
      navigate(`/login?redirect=${redirectTo}`);
      return;
    }

  try {} catch (e) {}
  navigate(path + search);
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (
      notification &&
      !notification.read &&
      notification.isNew &&
      !shownNotifs.current.has(notification._id)
    ) {
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const desktopNotification = new Notification('New Notification', {
            body: notification.message,
            icon: '/logo.png',
            tag: notification._id, 
            renotify: false,      
            requireInteraction: true
          });

          desktopNotification.onclick = () => {
            try { desktopNotification.close(); } catch (e) {}
            window.focus();
            try {
              if (notification._id) {
                dispatch(removeToastNotification(notification._id));
                if (token) dispatch(markNotificationAsRead(notification._id));
              }
            } catch (e) {}
            try {
              try {} catch (e) {}
              try {} catch (e) {}
            } catch (e) {}
            handleNotificationClick(notification);
          };

          shownNotifs.current.add(notification._id);
        } catch (error) {}
      }
    }
  }, [notification, dispatch, navigate]);

  return null;
});

NotificationHandler.displayName = 'NotificationHandler';

export default NotificationHandler;
