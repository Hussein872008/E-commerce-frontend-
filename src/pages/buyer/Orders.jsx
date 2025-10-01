import { useEffect, useState, useRef, useMemo, memo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  
  FiShoppingBag,
  FiAlertCircle,
  FiRefreshCw,
  FiX,

  FiDollarSign,
  FiCreditCard,
  FiBox,
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  fetchOrders,
  searchOrders,
  cancelOrder,
  fetchOrderStats,
  selectOrders,
  selectOrdersLoading,
  selectOrdersError,
  selectOrdersStats
} from "../../redux/orders.slice";



import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);


function OrderStatusChart({ data, darkMode }) {
  const completed = Number(data?.completed) || 0;
  const pending = Number(data?.pending) || 0;
  const cancelled = Number(data?.cancelled) || 0;
  const shipped = Number(data?.shipped) || 0;
  const processingCount = pending + shipped;
  const total = completed + processingCount + cancelled;
  const chartData = {
    labels: ["Completed", "Processing", "Cancelled"],
    datasets: [
      {
        data: [completed, processingCount, cancelled],
        backgroundColor: [
          "#10B981",
          "#3B82F6",
          "#EF4444"
        ],
        borderWidth: 0,
        hoverOffset: 12
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: darkMode ? '#E5E7EB' : '#1F2937',
          font: { size: 14 },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        },
        padding: 15,
        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
        titleColor: darkMode ? '#E5E7EB' : '#1F2937',
        bodyColor: darkMode ? '#E5E7EB' : '#1F2937',
        borderColor: darkMode ? '#374151' : '#E5E7EB',
        borderWidth: 1
      }
    },
    cutout: '45%'
  };

  if (total === 0) return null;

  return (
    <div className="h-72 w-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Order Distribution</h3>
        <FiBarChart2 className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
      </div>
      <div className={`${darkMode ? 'bg-gray-700 border border-gray-700' : 'bg-white border border-gray-100'} p-4 rounded-lg flex-1`}>
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}

const MemoizedOrderStatusChart = memo(OrderStatusChart);

const getStatusIcon = (status) => {
  switch (status) {
    case "Delivered":
      return <FiCheckCircle className="text-green-500 mr-2" />;
    case "Processing":
      return <FiClock className="text-blue-500 mr-2" />;
    case "Cancelled":
      return <FiXCircle className="text-red-500 mr-2" />;
    default:
      return <FiPackage className="text-gray-500 mr-2" />;
  }
};

const getStatusColor = (status, darkMode) => {
  if (darkMode) {
    switch (status) {
      case "Delivered":
        return "bg-green-900/30 text-green-300 border-green-700/50";
      case "Processing":
        return "bg-blue-900/30 text-blue-300 border-blue-700/50";
      case "Cancelled":
        return "bg-red-900/30 text-red-300 border-red-700/50";
      default:
        return "bg-gray-700 text-gray-300 border-gray-600";
    }
  }
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "Processing":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const formatDate = (dateString) => {
  const options = { year: "numeric", month: "short", day: "numeric" };
  try {
    return dateString ? new Date(dateString).toLocaleDateString("en-US", options) : "N/A";
  } catch {
    return "N/A";
  }
};

const formatImageUrl = (image) => {
  try {
    if (!image || typeof image !== 'string') return '/placeholder-image.webp';
    if (image.includes('undefined') || image.trim() === '') return '/placeholder-image.webp';
    if (/^https?:\/\//i.test(image)) return image;
    const cleanImage = image.startsWith('/') ? image.substring(1) : image;
    const base = import.meta.env.VITE_API_BASE_URL || '';
    return base ? `${base.replace(/\/$/, '')}/${cleanImage}` : `/${cleanImage}`;
  } catch (e) {
    return '/placeholder-image.webp';
  }
};

const OrderDetailsModal = ({ order, onClose, onCancel, darkMode }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white'}`}
      >
        <div className={`flex justify-between items-center border-b p-6 sticky top-0 z-10 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className="text-xl font-semibold flex items-center">
            <FiPackage className="mr-2" />
            Order Details #{order?._id || "N/A"}
          </h2>
          <button 
            onClick={onClose} 
            className={`p-1 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className={`font-medium mb-4 text-lg flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <FiBox className="mr-2" />
              Order Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FiCalendar className="mr-1" />
                  Order Date
                </p>
                <p className="font-medium">{formatDate(order?.createdAt)}</p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                <p className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order?.status, darkMode)} border`}>
                  {getStatusIcon(order?.status)}
                  {order?.status || "Unknown"}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FiCreditCard className="mr-1" />
                  Payment Method
                </p>
                <p>{order?.paymentMethod || "Credit Card"}</p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FiDollarSign className="mr-1" />
                  Total Amount
                </p>
                <p className="font-semibold text-lg">{order?.totalAmount || 0} $USD</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className={`font-medium mb-4 text-lg flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <FiShoppingBag className="mr-2" />
              Products ({order?.items?.length || 0})
            </h3>
            <ul className="space-y-3">
              {Array.isArray(order?.items) && order.items.length > 0 ? (
                order.items.map((item, idx) => {
                  const altText = item?.product?.title || 'Product image';
                  return (
                    <li 
                      key={item?.product?._id || item?._id || idx} 
                      tabIndex={0}
                      className={`flex items-center p-4 rounded-lg ${darkMode ? 'bg-gray-700/30 hover:bg-gray-700/50' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
                    >
                      <img
                        loading="lazy"
                        src={formatImageUrl(item?.product?.image)}
                        alt={altText}
                        className="h-16 w-16 object-cover rounded-md mr-4 border"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-image.webp'; }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item?.product?.title || "No title"}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item?.quantity || 0} × {item?.product?.price || 0} $USD
                        </p>
                      </div>
                      <div className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {(item?.quantity || 0) * (item?.product?.price || 0)} $USD
                      </div>
                    </li>
                  );
                })
              ) : (
                <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No products found for this order
                </p>
              )}
            </ul>
          </div>

          <div className={`flex justify-end space-x-3 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {order?.status === "Processing" && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onCancel();
                  onClose();
                }}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center transition-colors"
              >
                <FiXCircle className="mr-2" />
                Cancel order
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className={`px-5 py-2.5 border rounded-lg flex items-center transition-colors ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              Close
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function Orders() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const orders = useSelector(selectOrders) || [];
  const loading = useSelector(selectOrdersLoading);
  const error = useSelector(selectOrdersError);
  const stats = useSelector(selectOrdersStats) || {};
  const darkMode = useSelector(state => state.theme.darkMode);

  const [searchParams, setSearchParams] = useState({
    status: "",
    page: 1,
    limit: 10
  });

  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    currentPage: 1
  });

  const reduxPagination = useSelector(state => state.orders.pagination) || {};

  const initialTotalRef = useRef(0);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const orderRefs = useRef(new Map());
  const highlightTimerRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const highlight = params.get('highlight');
    if (!highlight) return;

    let mounted = true;

    const doHighlight = async () => {
      let target = highlight;

      if (!/^[0-9a-fA-F]{24}$/.test(target) && /^[0-9a-fA-F]{6,24}$/.test(target)) {
        try {
          const res = await dispatch(searchOrders({ page: 1, limit: 100, search: target }));
          if (searchOrders.fulfilled.match(res)) {
            const payload = res.payload || {};
            const found = Array.isArray(payload.orders) ? payload.orders.find(o => String(o._id).startsWith(target)) : (payload.items || []).find(o => String(o._id).startsWith(target));
            if (found) target = String(found._id);
          }
        } catch (e) {
        }
      }

      if (!mounted) return;

      const el = orderRefs.current.get(target) || document.getElementById(`order-${target}`);
      if (el && typeof el.scrollIntoView === 'function') {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-order');
          el.classList.add('highlight-persistent');
          if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
          highlightTimerRef.current = setTimeout(() => {
            try {
              el.classList.remove('highlight-order');
              el.classList.remove('highlight-persistent');
            } catch (e) {}
            try {
              const cur = new URL(window.location.href);
              cur.searchParams.delete('highlight');
              window.history.replaceState({}, '', cur.toString());
            } catch (e) {}
          }, 4200);
        } catch (e) {}
      }
    };

    doHighlight();

    return () => { mounted = false; if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current); };
  }, [location.search, orders, dispatch]);

  const debugMode = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('debug') === '1';
    } catch (e) {
      return false;
    }
  }, []);

  useEffect(() => {
    dispatch(fetchOrders()).then((res) => {
      try {
        if (fetchOrders.fulfilled.match(res)) {
          const payload = res.payload || {};
          const initialOrdersCount = Array.isArray(payload.orders) ? payload.orders.length : (payload.stats?.total || 0);
          initialTotalRef.current = Number(initialOrdersCount) || 0;
        }
      } catch (e) {
      }
    });
  }, [dispatch]);

  const openOrderDetails = useCallback((order) => {
    setSelectedOrder(order);
    setShowModal(true);
  }, []);

  useEffect(() => {
    dispatch(searchOrders(searchParams));
    dispatch(fetchOrderStats());
  }, [searchParams, dispatch]);

  const displayedOrders = useMemo(() => {
    if (!Array.isArray(orders) || orders.length === 0) return [];
    return orders.filter(o => {
      if (!searchParams.status) return true;
      if (searchParams.status === 'Processing') {
        return (o.status === 'Processing' || o.status === 'Shipped');
      }
      return o.status === searchParams.status;
    });
  }, [orders, searchParams]);

  useEffect(() => {
    try {
    } catch (e) {
    }
  }, [searchParams, orders, stats]);

  const hasAnyOrders = useMemo(() => {
    const sTotal = Number(stats?.total || 0);
    const pTotal = Number(reduxPagination?.total || 0);
    return (initialTotalRef.current > 0) || (sTotal > 0) || (pTotal > 0);
  }, [stats, reduxPagination]);


  const handleCancelOrder = useCallback(async (orderId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this action!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, cancel it",
      cancelButtonText: "No",
      background: darkMode ? '#1f2937' : '#fff',
      color: darkMode ? '#e5e7eb' : '#000'
    });

    if (result.isConfirmed) {
      try {
        const res = await dispatch(cancelOrder(orderId));
        if (cancelOrder.fulfilled.match(res)) {
          toast.success("Order cancelled successfully");
        }
      } catch (error) {
        toast.error("Failed to cancel order");
      }
    }
  }, [dispatch, darkMode]);

  const OrderLoadingSkeleton = () => (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`rounded-xl shadow-lg overflow-hidden border animate-pulse ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className={`p-6 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center">
              <div className={`h-10 w-10 rounded-full mr-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              <div>
                <div className={`h-4 w-32 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} mb-2`}></div>
                <div className={`h-3 w-24 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              </div>
            </div>
            <div className={`h-6 w-20 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          </div>
          <div className="p-6">
            <div className="flex justify-between mb-4">
              <div className={`h-4 w-40 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              <div className={`h-4 w-24 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            </div>
            <div className="flex justify-end space-x-3">
              <div className={`h-10 w-24 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              <div className={`h-10 w-24 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (error) {
    return (
      <div className={`p-6 w-full min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
          <div className="text-center">
            <FiAlertCircle className="mx-auto text-red-500 text-5xl mb-4" />
            <h2 className="text-xl font-bold mb-2">Error Loading Orders</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => dispatch(fetchOrders())}
              className={`px-4 py-2 rounded-lg flex items-center mx-auto ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
            >
              <FiRefreshCw className="mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && !hasAnyOrders) {
    return (
      <div className={`p-6 w-full min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50'}`}>
        <div className={`max-w-2xl w-full p-8 rounded-xl shadow-lg text-center ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white'}`}>
          {debugMode && (
            <div className="fixed right-4 top-4 z-50 w-80 max-h-[70vh] overflow-auto p-3 rounded-lg bg-white/90 text-sm shadow-lg border">
              <div className="text-xs font-semibold mb-2">Orders Debug</div>
              <div className="text-xs break-words"><strong>searchParams:</strong> {JSON.stringify(searchParams)}</div>
              <div className="text-xs break-words"><strong>orders.length:</strong> {orders?.length || 0}</div>
              <div className="text-xs break-words"><strong>displayed.length:</strong> {displayedOrders?.length || 0}</div>
              <div className="text-xs break-words"><strong>stats:</strong> {JSON.stringify(stats)}</div>
            </div>
          )}

          <FiPackage className="mx-auto text-6xl mb-4 text-gray-500" />
          <h2 className="text-2xl font-bold mb-2">No orders found</h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            You haven't placed any orders yet. Start shopping to create your first order.
          </p>
          <div className="mt-6">
            <Link to="/store" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center">
              <FiShoppingBag className="mr-2" />
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 w-full min-h-screen ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {debugMode && (
          <div className="fixed right-4 top-4 z-50 w-80 max-h-[70vh] overflow-auto p-3 rounded-lg bg-white/90 text-sm shadow-lg border">
            <div className="text-xs font-semibold mb-2">Orders Debug</div>
            <div className="text-xs break-words"><strong>searchParams:</strong> {JSON.stringify(searchParams)}</div>
            <div className="text-xs break-words"><strong>orders.length:</strong> {orders?.length || 0}</div>
            <div className="text-xs break-words"><strong>displayed.length:</strong> {displayedOrders?.length || 0}</div>
            <div className="text-xs break-words"><strong>stats:</strong> {JSON.stringify(stats)}</div>
          </div>
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <FiPackage className="mr-3" />
            My Orders
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            View and manage all your orders in one place
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className={`lg:col-span-3 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <h2 className="text-xl font-semibold mb-4 md:mb-0">Order History</h2>
                <div className="w-48">
                  <select
                    value={searchParams.status}
                    onChange={(e) => setSearchParams({ ...searchParams, status: e.target.value, page: 1 })}
                    className={`w-full p-2.5 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">All Orders</option>
                    <option value="Processing">Processing</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <OrderLoadingSkeleton />
              ) : (searchParams.status && Array.isArray(displayedOrders) && displayedOrders.length === 0) ? (
                <div className={`w-full p-8 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-100 text-gray-800'}`}>
                  <div className="max-w-xl mx-auto text-center">
                    <div className={`mx-auto mb-4 w-20 h-20 flex items-center justify-center rounded-full ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
                      <FiPackage className={`text-3xl ${darkMode ? 'text-yellow-300' : 'text-yellow-500'}`} />
                    </div>
                    <h3 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>No orders for "{searchParams.status}"</h3>
                    <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>We couldn't find any orders with the status <strong className={darkMode ? 'text-gray-100' : 'text-gray-800'}>"{searchParams.status}"</strong>. Try resetting the filter to see all orders.</p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setSearchParams({ ...searchParams, status: '', page: 1 })}
                        className={`px-4 py-2 rounded-lg font-medium ${darkMode ? 'bg-gray-700 border border-gray-600 text-white hover:bg-gray-600' : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'}`}
                      >
                        Reset filter
                      </button>
                    </div>
                  </div>
                </div>
              ) : !hasAnyOrders ? (
                <div className={`w-full p-8 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-100 text-gray-800'}`}>
                  <div className="max-w-xl mx-auto text-center">
                    <div className={`mx-auto mb-4 w-20 h-20 flex items-center justify-center rounded-full ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                      <FiPackage className={`text-3xl ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">No orders found</h3>
                    <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>You don't have any orders yet. Start shopping to create your first order.</p>
                    <div className="flex items-center justify-center gap-3">
                      <Link
                        to="/products"
                        className={`px-4 py-2 rounded-lg font-medium ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        <FiShoppingBag className="mr-2" />
                        Start Shopping
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {displayedOrders.length === 0 ? null : displayedOrders.map((order) => (
                    <motion.div
                      key={order._id}
                      ref={(el) => orderRefs.current.set(order._id, el)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ y: -4, boxShadow: '0 10px 20px rgba(0,0,0,0.08)' }}
                      style={{
                        transition: 'background-color 0.3s ease-out'
                      }}
                      className={`rounded-xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} ${
                        'shadow-lg'
                      }`}
                    >
                      <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div
                            className="flex items-center mb-4 md:mb-0 cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onClick={() => openOrderDetails(order)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOrderDetails(order); } }}
                          >
                            {order.items?.[0]?.product?.image ? (
                              <img
                                loading="lazy"
                                src={formatImageUrl(order.items[0].product.image)}
                                alt={order.items[0].product?.title || 'Order thumbnail'}
                                className="h-10 w-10 object-cover rounded-md mr-3 border transform transition-transform duration-200 hover:scale-110"
                                onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-image.webp'; }}
                              />
                            ) : (
                              <div className={`h-10 w-10 rounded-md mr-3 flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <FiPackage className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                              </div>
                            )}

                            <div>
                              <p className="font-medium">Order #{order._id}</p>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status, darkMode)} border`}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</p>
                            <p className="text-xl font-semibold">{order.totalAmount} $USD</p>
                          </div>
                          <div className="mt-4 md:mt-0">
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Items</p>
                            <p className="font-medium">{order.items?.length || 0} products</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end">
                          {order.status === "Processing" && (
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center transition-colors"
                            >
                              <FiXCircle className="mr-2" />
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {(stats.pages > 1 || pagination.pages > 1) && (
                (() => {
                  const totalPages = stats.pages || pagination.pages;
                  const current = stats.currentPage || pagination.currentPage;
                  return (
                    <div className={`mt-8 flex justify-center items-center space-x-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <button
                        onClick={() => setSearchParams({ ...searchParams, page: Math.max(1, current - 1) })}
                        disabled={current === 1}
                        aria-label="Previous page"
                        className={`p-2 rounded-lg ${current === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'} ${darkMode ? 'hover:bg-gray-700' : ''}`}
                      >
                        <FiChevronLeft />
                      </button>

                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSearchParams({ ...searchParams, page: i + 1 })}
                          aria-label={`Go to page ${i + 1}`}
                          className={`w-10 h-10 rounded-lg ${current === i + 1 ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200')}`}
                        >
                          {i + 1}
                        </button>
                      ))}

                      <button
                        onClick={() => setSearchParams({ ...searchParams, page: Math.min(totalPages, current + 1) })}
                        disabled={current === totalPages}
                        aria-label="Next page"
                        className={`p-2 rounded-lg ${current === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'} ${darkMode ? 'hover:bg-gray-700' : ''}`}
                      >
                        <FiChevronRight />
                      </button>
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          {((stats.total || 0) > 0 || (Number(stats.completed || 0) + Number(stats.pending || 0) + Number(stats.shipped || 0) + Number(stats.cancelled || 0)) > 0) && (
            <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <FiBarChart2 className="mr-2" />
                Order Summary
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-blue-900/20 border border-blue-800/50' : 'bg-blue-50 border border-blue-100'}`}>
                    <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
                    <div className="text-sm mt-1">Total Orders</div>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-green-900/20 border border-green-800/50' : 'bg-green-50 border border-green-100'}`}>
                    <div className="text-2xl font-bold text-green-600">{stats.completed || 0}</div>
                    <div className="text-sm mt-1">Completed</div>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-blue-900/20 border border-blue-800/50' : 'bg-blue-50 border border-blue-100'}`}>
                    <div className="text-2xl font-bold text-blue-600">{(Number(stats.pending || 0) + Number(stats.shipped || 0)) || 0}</div>
                    <div className="text-sm mt-1">Processing</div>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-red-900/20 border border-red-800/50' : 'bg-red-50 border border-red-100'}`}>
                    <div className="text-2xl font-bold text-red-600">{stats.cancelled || 0}</div>
                    <div className="text-sm mt-1">Cancelled</div>
                  </div>
                </div>
                
                <MemoizedOrderStatusChart data={stats} darkMode={darkMode} />
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setShowModal(false)}
            onCancel={() => handleCancelOrder(selectedOrder?._id)}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}