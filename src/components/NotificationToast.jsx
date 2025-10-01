import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, forwardRef } from 'react';
import { FiBell, FiBox, FiShoppingCart, FiAlertCircle, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import store from '../redux/store';
import { searchOrders } from '../redux/orders.slice';
import { fetchFilteredProducts } from '../redux/productSlice';
import { markNotificationAsRead } from '../redux/notificationSlice';
import { getNotificationLink } from '../utils/notificationLink';

const NotificationToast = forwardRef(({ notification, onClose }, ref) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose, notification._id]);

    const getIcon = () => {
        switch (notification.type) {
            case 'order':
                return <FiShoppingCart className="text-green-500" />;
            case 'product':
            case 'product-available':
                return <FiBox className="text-blue-500" />;
            default:
                return <FiAlertCircle className="text-yellow-500" />;
        }
    };

    const orders = useSelector(state => state.orders?.items || []);

    const handleClick = async () => {
        if (notification._id) {
            dispatch(markNotificationAsRead(notification._id));
        }
        let user = null;
        try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { user = null; }
        const role = user && (user.role || user.roles) ? (user.role || (Array.isArray(user.roles) ? user.roles[0] : user.roles)) : null;

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
                    if (s && s !== 'undefined' && s !== 'null') return s;
                } catch (e) { }
                return null;
            }
            if (typeof v === 'string') { const tv = v.trim(); if (tv === '' || tv === 'undefined' || tv === 'null') return null; return tv; }
            return String(v);
        };

                const link = getNotificationLink(notification);
                let related = link.related || null;

                        if (!related) {
                            try {
                                const m = notification?.message && notification.message.match(/#([0-9a-fA-F]{6,24})/);
                                if (m && m[1]) {
                                    const prefix = m[1];
                                    try {
                                        await dispatch(searchOrders({ page: 1, limit: 100, search: prefix }));
                                    } catch (e) {}
                                    const latestOrders = (store.getState().orders && store.getState().orders.items) || [];
                                    const matched = latestOrders.find(o => String(o._id).startsWith(prefix));
                                    if (matched) {
                                        related = String(matched._id);
                                    } else {
                                    }
                                }
                            } catch (e) {}
                        }

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

                    if (notification.type === 'order') {
                if (role === 'buyer' || role === 'user') navigate(appendHighlight(`/buyer/orders`, link.search || '', related));
                else navigate(appendHighlight(`/seller/orders`, link.search || '', related));
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
                        } catch (e) {}
                    }
                    if (resolved) {
                        const target = appendHighlight(`/product/${resolved}`, '', resolved);
                        navigate(target);
                    } else {
                        navigate('/store');
                    }
                } else {
                    const baseSearch = link.search || (() => {
                        const p = new URLSearchParams();
                        p.set('open', 'stockAlerts');
                        if (related) p.set('highlight', related);
                        return `?${p.toString()}`;
                    })();
                    navigate(appendHighlight(`/seller`, baseSearch, related));
                }
            } else {
                navigate(appendHighlight((link.pathname || '/'), link.search || '', related));
            }
        onClose();
    };



    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-start gap-3 bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm sm:max-w-sm cursor-pointer mb-3"
            onClick={handleClick}
        >
            <div className="flex-shrink-0 p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                {getIcon()}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-sm font-semibold text-gray-900 dark:text-white">
                    {notification.message}
                </p>
                <p className="mt-1 text-xs sm:text-xs text-gray-500 dark:text-gray-400">
                    Just now
                </p>
                <div className="mt-2 flex items-center gap-2">
                    {notification.priority && (
                        <span className={`px-2 py-0.5 text-[11px] rounded-full font-semibold ${
                            notification.priority === 'high'
                                ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300'
                                : notification.priority === 'low'
                                ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                : 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}>
                            {String(notification.priority).toUpperCase()}
                        </span>
                    )}
                    {notification.channels && Array.isArray(notification.channels) && notification.channels.length > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{notification.channels.join(', ')}</span>
                    )}
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (notification._id) {
                        dispatch(markNotificationAsRead(notification._id));
                    }
                    onClose();
                }}
                className="flex-shrink-0 -mr-1 -mt-1 p-1.5 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <FiX className="w-4 h-4" />
            </button>
        </motion.div>
    );
});

const NotificationToastContainer = ({ notifications, onClose }) => {
    return (
        <div className="fixed top-12 right-4 left-4 sm:right-4 sm:left-auto p-2 sm:p-4 z-50 flex flex-col items-end">
            <AnimatePresence>
                        {notifications.map((notification, idx) => {
                            const idPart = notification._id && String(notification._id).trim();
                            const relatedPart = notification.relatedId && String(notification.relatedId).trim();
                            const datePart = notification.createdAt && String(notification.createdAt).trim();
                            const toastKey = `t-${idPart || relatedPart || datePart || idx}`;
                            return (
                            <NotificationToast
                                key={toastKey}
                                notification={notification}
                                onClose={() => onClose(notification._id)}
                            />
                            );
                        })}
                    </AnimatePresence>
        </div>
    );
};

NotificationToast.displayName = 'NotificationToast';

export default NotificationToastContainer;
