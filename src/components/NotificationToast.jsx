import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, forwardRef } from 'react';
import { FiBell, FiBox, FiShoppingCart, FiAlertCircle, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setHighlightedOrder, markNotificationAsRead } from '../redux/notificationSlice';

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

    const handleClick = () => {
        if (notification._id) {
            dispatch(markNotificationAsRead(notification._id));
        }
        let user = null;
        try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) { user = null; }
        const role = user && (user.role || user.roles) ? (user.role || (Array.isArray(user.roles) ? user.roles[0] : user.roles)) : null;

        if (notification.type === 'order' && notification.relatedId) {
            dispatch(setHighlightedOrder(notification.relatedId));
            if (role === 'buyer' || role === 'user') {
                navigate(`/buyer/orders?highlight=${notification.relatedId}`);
            } else {
                navigate(`/seller/orders?highlight=${notification.relatedId}`);
            }
        } else if (notification.type === 'product' && notification.relatedId) {
            navigate(`/seller/my-products?highlight=${notification.relatedId}`);
        } else if ((notification.type === 'product-available') && notification.relatedId) {
            navigate(`/product/${notification.relatedId}`);
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
            className="flex items-start gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm cursor-pointer mb-3"
            onClick={handleClick}
        >
            <div className="flex-shrink-0 p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                {getIcon()}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {notification.message}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Just now
                </p>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (notification._id) {
                        dispatch(markNotificationAsRead(notification._id));
                    }
                    onClose();
                }}
                className="flex-shrink-0 -mr-1 -mt-1 p-2 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <FiX className="w-4 h-4" />
            </button>
        </motion.div>
    );
});

const NotificationToastContainer = ({ notifications, onClose }) => {
    return (
        <div className="fixed top-16 right-4 p-4 z-50">
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
