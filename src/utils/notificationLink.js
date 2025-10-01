const isOidString = (v) => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);

const isHexPrefix = (v) => typeof v === 'string' && /^[0-9a-fA-F]{6,24}$/.test(v);

const normalizeHighlight = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'object') {
    try {
      if (v._id) {
        const s = String(v._id).trim();
        if (s && s !== 'undefined' && s !== 'null') return s;
      }
      if (v.id) {
        const s = String(v.id).trim();
        if (s && s !== 'undefined' && s !== 'null') return s;
      }
      const s = String(v).trim();
      if (s === '' || s === 'undefined' || s === 'null') return null;
      return s;
    } catch (e) {
      return null;
    }
  }
  if (typeof v === 'string') {
    if (v === '' || v === 'undefined' || v === 'null') return null;
    return v;
  }
  return String(v);
};

const extractOrderIdFromMessage = (msg) => {
  if (!msg) return null;
  const mFull = msg.match(/#([0-9a-fA-F]{24})/);
  if (mFull && mFull[1]) return mFull[1];
  const mShort = msg.match(/#([0-9a-fA-F]{6,24})/);
  return mShort ? mShort[1] : null;
};

const extractObjectIdFromNotification = (notification, excludeId) => {
  if (!notification || typeof notification !== 'object') return null;

  try {

    if (notification.relatedId && isOidString(notification.relatedId) && String(notification.relatedId) !== String(excludeId)) return notification.relatedId;
    if (notification.orderId && isOidString(notification.orderId) && String(notification.orderId) !== String(excludeId)) return notification.orderId;
    if (notification.related && isOidString(notification.related) && String(notification.related) !== String(excludeId)) return notification.related;
    if (notification.data && notification.data.order && notification.data.order._id && isOidString(notification.data.order._id) && String(notification.data.order._id) !== String(excludeId)) return notification.data.order._id;
  if (notification.orderData && notification.orderData.orderId && isOidString(notification.orderData.orderId) && String(notification.orderData.orderId) !== String(excludeId)) return notification.orderData.orderId;

  if (notification.data && notification.data.product && (notification.data.product._id || notification.data.product.id) && isOidString(notification.data.product._id || notification.data.product.id) && String(notification.data.product._id || notification.data.product.id) !== String(excludeId)) return notification.data.product._id || notification.data.product.id;
  if (notification.productId && isOidString(notification.productId) && String(notification.productId) !== String(excludeId)) return notification.productId;
  if (notification.data && notification.data.productId && isOidString(notification.data.productId) && String(notification.data.productId) !== String(excludeId)) return notification.data.productId;
  } catch (e) {}

  const skipKeys = new Set(['recipient', 'buyer', 'seller', 'user', 'author', '_id', 'id', 'notificationId']);
  const seen = new Set();
  const stack = [notification];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    if (seen.has(node)) continue;
    seen.add(node);
    for (const k of Object.keys(node)) {
      try {
        if (skipKeys.has(k)) continue;
        const val = node[k];

        if (String(val) === String(excludeId)) continue;
        if (isOidString(val)) return val;
        if (Array.isArray(val)) {
          for (const el of val) if (el && typeof el === 'object') stack.push(el);
        } else if (val && typeof val === 'object') {
          stack.push(val);
        }
      } catch (err) {}
    }
  }
  return null;
};

export function getNotificationLink(notification) {

  let related = normalizeHighlight(
    notification?.relatedId ||
    notification?.related ||
    (notification?.data && notification.data.order && notification.data.order._id) ||

    (notification?.data && notification.data.product && (notification.data.product._id || notification.data.product.id)) ||
    notification?.data?.productId || notification?.productId ||
    (notification?.meta && notification.meta.originalRelatedId) ||
    notification?.orderId
  );


  if (!related) {
    related = extractObjectIdFromNotification(notification, notification?._id);
  }


  if (!related) {
    related = extractOrderIdFromMessage(notification?.message);
  }


  if (related && isHexPrefix(related) && !isOidString(related)) {

  }


  if ((notification?.type === 'product-available' || notification?.type === 'product') && related) {

    if (notification.type === 'product-available') {
      return { pathname: `/product/${related}`, search: '', related };
    }

    if (notification.type === 'product') {
      const params = new URLSearchParams();

      params.set('open', 'stockAlerts');
      params.set('highlight', related);


      const qty = notification?.data?.quantity ?? notification?.data?.stock ?? notification?.meta?.quantity ?? notification?.meta?.stock;
      if (typeof qty === 'number') {

        params.set('severity', qty < 5 ? 'warning' : 'info');
      } else {

        params.set('severity', 'warning');
      }

      return { pathname: `/seller/dashboard`, search: `?${params.toString()}`, related };
    }
  }

  if (notification?.type === 'order') {

  return { pathname: `/seller/orders`, search: '', related };
  }

  return { pathname: '/store', search: '', related: null };
}

export default { getNotificationLink };

try {
  if (typeof window !== 'undefined') {
    window.__getNotificationLink = (notification) => {
      try { return getNotificationLink(notification); } catch (e) { return { error: String(e) }; }
    };

    window.__getNotificationURL = (notification, origin) => {
      try {
        const link = getNotificationLink(notification);
        const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
        return (base || '') + (link.pathname || '') + (link.search || '');
      } catch (e) { return String(e); }
    };
  }
} catch (e) {}
