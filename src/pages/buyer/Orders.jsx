import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiChevronDown,
  FiChevronUp,
  FiShoppingBag,
  FiAlertCircle,
  FiRefreshCw,
  FiAlertTriangle,
  FiX
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  fetchOrders,
  searchOrders,
  cancelOrder,
  selectOrders,
  selectOrdersLoading,
  selectOrdersError,
  selectOrdersStats
} from "../../redux/orders.slice";

// chart.js
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

// ====== OrderStatusChart Component (Merged) ======
function OrderStatusChart({ data, darkMode }) {
  const chartData = {
    labels: ["Completed", "Processing", "Cancelled"],
    datasets: [
      {
        data: [data.completed, data.pending, data.cancelled],
        backgroundColor: [
          "#10B981", // green
          "#3B82F6", // blue
          "#EF4444"  // red
        ],
        borderWidth: 0
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
          font: {
            size: 14,
          }
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
        }
      }
    }
  };

  return (
    <div className="h-64 w-64 mx-auto">
      <Pie data={chartData} options={options} />
    </div>
  );
}

// ====== Orders Page ======
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
        return "bg-green-900/50 text-green-300";
      case "Processing":
        return "bg-blue-900/50 text-blue-300";
      case "Cancelled":
        return "bg-red-900/50 text-red-300";
      default:
        return "bg-gray-700 text-gray-300";
    }
  }
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-800";
    case "Processing":
      return "bg-blue-100 text-blue-800";
    case "Cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
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

// 🔹 دالة موحدة لتنسيق رابط الصورة
// في ملف Orders.jsx - استبدال دالة formatImageUrl الحالية بهذه الدالة
const formatImageUrl = (image) => {
  if (!image || typeof image !== 'string' || image.includes('undefined')) {
    return image;
  }

  if (image.startsWith("http")) {
    return image;
  }

  const cleanImage = image.startsWith("/") ? image.substring(1) : image;
  const finalUrl = `${import.meta.env.VITE_API_BASE_URL || ""}/${cleanImage}`;
  
  return finalUrl;
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onCancel, darkMode }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white'}`}>
        <div className={`flex justify-between items-center border-b p-4 sticky top-0 z-10 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <h2 className="text-xl font-semibold">Order Details #{order?._id ? order._id.slice(-6).toUpperCase() : "N/A"}</h2>
          <button onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            <FiX size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <h3 className={`font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Order Date</p>
                <p>{formatDate(order?.createdAt)}</p>
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order?.status, darkMode)}`}>
                  {order?.status || "Unknown"}
                </p>
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Payment Method</p>
                <p>{order?.paymentMethod || "Credit Card"}</p>
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Amount</p>
                <p className="font-semibold">{order?.totalAmount || 0} USD</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className={`font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Products</h3>
            <ul className="space-y-3">
              {Array.isArray(order?.items) && order.items.length > 0 ? (
                order.items.map((item) => (
                  <li key={item?.product?._id || item?._id || Math.random()} className={`flex items-center p-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <img
                      loading="lazy"
                      src={formatImageUrl(item?.product?.image)}
                      alt={item?.product?.title || "Product"}
                      className="h-16 w-16 object-cover rounded-md mr-4 border"
                      onError={(e) => (e.target.src = '/placeholder-image.webp')}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item?.product?.title || "No title"}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item?.quantity || 0} × {item?.product?.price || 0} USD</p>
                    </div>
                    <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{(item?.quantity || 0) * (item?.product?.price || 0)} USD</div>
                  </li>
                ))
              ) : (
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No products found for this order</p>
              )}
            </ul>
          </div>

          <div className={`flex justify-end space-x-3 pt-4 border-t ${darkMode ? 'border-gray-700' : ''}`}>
            {order?.status === "Processing" && (
              <button
                onClick={() => {
                  onCancel();
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Cancel order
              </button>
            )}
            <button
              onClick={onClose}
              className={`px-4 py-2 border rounded-lg ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
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
    dateFrom: "",
    dateTo: "",
    page: 1,
    limit: 10
  });

  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    currentPage: 1
  });

  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  useEffect(() => {
    // This effect will run whenever searchParams changes
    dispatch(searchOrders(searchParams));
  }, [searchParams, dispatch]);

  const handleSearch = (e) => {
    e?.preventDefault?.();
    setSearchParams(prev => ({ ...prev, page: 1 }));
  };

const handleCancelOrder = async (orderId) => {
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
};

  if (loading) {
    // Skeleton loading for orders page
    return (
      <div className={`p-6 w-full ${darkMode ? 'bg-gray-900' : ''}`}>
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`rounded-lg shadow-lg overflow-hidden border animate-pulse ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <div className={`p-5 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : ''}`}>
                <div className="flex items-center">
                  <div className={`h-8 w-8 rounded-full mr-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <div>
                    <div className={`h-4 w-32 rounded mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className={`h-3 w-24 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}></div>
                  </div>
                </div>
                <div className={`h-6 w-20 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              </div>
              <div className="p-5">
                <div className={`h-4 w-1/2 rounded mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className={`h-4 w-1/3 rounded mb-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}></div>
                <div className={`h-4 w-1/4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 w-full ${darkMode ? 'bg-gray-900' : ''}`}>
        <div className={`${darkMode ? 'bg-red-900/50 border-red-500' : 'bg-red-50 border-red-500'} border-l-4 p-4 rounded`}>
          <div className="flex items-start">
            <FiAlertCircle className="text-red-500 text-xl mt-1 mr-2" />
            <div>
              <h3 className={`text-lg font-medium ${darkMode ? 'text-red-300' : 'text-red-800'}`}>An error occurred</h3>
              <p className={`text-sm mt-1 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
              {error.includes('Authentication failed') ? (
                <button
                  onClick={() => navigate('/login')}
                  className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  Go to Login
                </button>
              ) : (
                <button
                  onClick={() => dispatch(fetchOrders())}
                  className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  <FiRefreshCw className="mr-1" />
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 w-full min-h-screen ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50'}`}>
      {showModal && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowModal(false)}
          onCancel={() => handleCancelOrder(selectedOrder?._id)}
          darkMode={darkMode}
        />
      )}

      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`text-3xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        My Orders
      </motion.h1>

      {(orders.length !== 0 || (stats.total || 0) !== 0) && (
        <>
          {/* Filter */}
          <div className={`p-4 rounded-lg shadow mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Filter Orders</h2>
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={searchParams.status}
                onChange={(e) => setSearchParams({ ...searchParams, status: e.target.value })}
                className={`p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              >
                <option value="">All statuses</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <input type="date" value={searchParams.dateFrom} onChange={(e) => setSearchParams({ ...searchParams, dateFrom: e.target.value })} className={`p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
              <input type="date" value={searchParams.dateTo} onChange={(e) => setSearchParams({ ...searchParams, dateTo: e.target.value })} className={`p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
              <div className="flex items-center">
                <button type="submit" className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">Search</button>
                <button
                  type="button"
                  onClick={() => { setSearchParams({ status: "", dateFrom: "", dateTo: "", page: 1, limit: 10 }); dispatch(fetchOrders()); }}
                  className={`ml-2 px-4 py-2 border rounded ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300'}`}
                >Clear</button>
              </div>
            </form>
          </div>

          {/* Stats + Chart */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`p-4 rounded-lg shadow border-l-4 border-green-500 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Orders</h3>
              <p className="text-2xl font-bold">{stats.total || 0}</p>
            </div>
            <div className={`p-4 rounded-lg shadow border-l-4 border-blue-500 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Processing</h3>
              <p className="text-2xl font-bold">{stats.pending || 0}</p>
            </div>
            <div className={`p-4 rounded-lg shadow border-l-4 border-green-500 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Completed</h3>
              <p className="text-2xl font-bold">{stats.completed || 0}</p>
            </div>
            <div className={`p-4 rounded-lg shadow border-l-4 border-red-500 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cancelled</h3>
              <p className="text-2xl font-bold">{stats.cancelled || 0}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className={`p-6 rounded-lg shadow mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Order Status</h2>
            <OrderStatusChart data={stats} darkMode={darkMode} />
          </motion.div>
        </>
      )}

      {/* Orders list & notices */}
      {orders.length === 0 && (stats.total || 0) === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`text-center rounded-lg shadow min-h-screen flex items-center justify-center px-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className="w-full">
            <FiPackage className="mx-auto text-6xl text-gray-400 mb-6" />
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6 text-lg`}>No orders yet</p>
            <Link to="/store" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center justify-center">
              Browse store
              <FiShoppingBag className="ml-2" />
            </Link>
          </div>
        </motion.div>
      ) : orders.length === 0 && (stats.total || 0) > 0 ? (
        <div className={`${darkMode ? 'bg-yellow-900/50 border-yellow-500' : 'bg-yellow-50 border-yellow-400'} border-l-4 p-4 mb-6`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                There are {stats.total || 0} order(s) in your records but they cannot be displayed right now.
                <button
                  onClick={() => dispatch(fetchOrders())}
                  className={`ml-2 text-sm font-medium underline ${darkMode ? 'text-yellow-200 hover:text-yellow-100' : 'text-yellow-700 hover:text-yellow-600'}`}
                >
                  Try refreshing
                </button>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-6">
          {orders.map((order) => (
            <motion.div
              key={order?._id || Math.random()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-lg shadow-lg overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
            >
              <div className={`p-5 border-b cursor-pointer transition-colors ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => toggleOrderExpand(order?._id)}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    {getStatusIcon(order?.status)}
                    <div className="mr-3">
                      <h2 className="font-semibold text-lg">Order #{order?._id ? order._id.slice(-6).toUpperCase() : "N/A"}</h2>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Order date: {formatDate(order?.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order?.status, darkMode)}`}>
                      {order?.status || "Unknown"}
                    </span>
                    {expandedOrder === order?._id ? <FiChevronUp className="ml-2 text-gray-500" /> : <FiChevronDown className="ml-2 text-gray-500" />}
                  </div>
                </div>
              </div>

              {expandedOrder === order?._id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                  <div className="p-5">
                    <h3 className={`font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Products:</h3>
                    <ul className="space-y-3">
                      {Array.isArray(order?.items) && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <li key={item?.product?._id || item?._id || Math.random()} className={`flex items-center p-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                            <img
                              loading="lazy"
                              src={formatImageUrl(item?.product?.image)}
                              alt={item?.product?.title || "Product"}
                              className="h-16 w-16 object-cover rounded-md mr-4 border"
                              onError={(e) => (e.target.src = '/placeholder-image.webp')}
                            />

                            <div className="flex-1">
                              <p className="font-medium">{item?.product?.title || "No title"}</p>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item?.quantity || 0} × {item?.product?.price || 0} USD</p>
                            </div>
                            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{(item?.quantity || 0) * (item?.product?.price || 0)} USD</div>
                          </li>
                        ))
                      ) : (
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No products found for this order</p>
                      )}
                    </ul>
                  </div>
                  <div className={`p-5 flex justify-between items-center ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Payment method: {order?.paymentMethod || "Credit Card"}</p>
                      <p className="font-semibold text-lg">Total: {order?.totalAmount || 0} USD</p>
                    </div>
                    <div className="space-x-3">
                      <button
                        onClick={() => openOrderDetails(order)}
                        className={`px-4 py-2 border rounded-lg ${darkMode ? 'border-green-600 text-green-300 hover:bg-green-900/50' : 'border-green-600 text-green-600 hover:bg-green-50'}`}
                      >
                        View details
                      </button>
                      {order?.status === "Processing" && (
                        <button onClick={() => handleCancelOrder(order._id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                          Cancel order
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {(orders.length !== 0 || (stats.total || 0) !== 0) && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setSearchParams({ ...searchParams, page: Math.max(1, (searchParams.page || 1) - 1) })}
            disabled={(pagination.currentPage || 1) === 1}
            className={`px-4 py-2 border rounded disabled:opacity-50 ${darkMode ? 'border-gray-600 hover:bg-gray-700 disabled:hover:bg-gray-800' : 'border-gray-300'}`}
          >
            Previous
          </button>
          <span>Page {pagination.currentPage || 1} of {pagination.pages || 1}</span>
          <button
            onClick={() => setSearchParams({ ...searchParams, page: Math.min((pagination.pages || 1), (searchParams.page || 1) + 1) })}
            disabled={(pagination.currentPage || 1) >= (pagination.pages || 1)}
            className={`px-4 py-2 border rounded disabled:opacity-50 ${darkMode ? 'border-gray-600 hover:bg-gray-700 disabled:hover:bg-gray-800' : 'border-gray-300'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
