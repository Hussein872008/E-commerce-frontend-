import { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { updateSellerOrderStatus } from "../../redux/adminSlice";
import { searchOrders } from '../../redux/orders.slice';
import { FiRefreshCw, FiFilter, FiShoppingCart, FiDollarSign, FiX, FiSearch, FiClock, FiTruck, FiCheckCircle, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from "framer-motion";

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { updating, updateError } = useSelector(state => state.admin || {});
  const isDarkMode = useSelector(state => state.theme.darkMode);
  const [successMsg, setSuccessMsg] = useState("");
  const ordersState = useSelector(state => state.orders || {});
  const orders = ordersState.items || [];
  const loading = ordersState.loading;
  const error = ordersState.error;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);


  const location = useLocation();
  const orderRefs = useRef(new Map());
  const highlightTimerRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const highlight = params.get('highlight');
    if (!highlight) return;

    let mounted = true;

    const resolveAndScroll = async () => {
      let target = highlight;
      if (!/^[0-9a-fA-F]{24}$/.test(target) && /^[0-9a-fA-F]{6,24}$/.test(target)) {
        try {
          const res = await dispatch(searchOrders({ page: 1, limit: 100, search: target }));
          if (searchOrders.fulfilled.match(res)) {
            const payload = res.payload || {};
            const found = Array.isArray(payload.orders) ? payload.orders.find(o => String(o._id).startsWith(target)) : (payload.items || []).find(o => String(o._id).startsWith(target));
            if (found) target = String(found._id);
          }
        } catch (e) {}
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
            try { el.classList.remove('highlight-order'); el.classList.remove('highlight-persistent'); } catch (e) {}
            try { const cur = new URL(window.location.href); cur.searchParams.delete('highlight'); window.history.replaceState({}, '', cur.toString()); } catch (e) {}
          }, 4200);
        } catch (e) {}
      }
    };

    resolveAndScroll();

    return () => { mounted = false; if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current); };
  }, [location.search, dispatch, orders]);

  useEffect(() => {
  
  }, []);

  useEffect(() => {
    let timer;
    if (successMsg) {
      timer = setTimeout(() => setSuccessMsg("") , 3000);
    }
    return () => clearTimeout(timer);
  }, [successMsg]);



  useEffect(() => {
  
    dispatch(searchOrders({ page: 1, limit: 100 }));
  }, []);

  const handleStatusUpdate = (orderId) => {
    dispatch(updateSellerOrderStatus({ orderId, status: "Shipped" }))
      .then((res) => {
        if (!res.error) {
          setSuccessMsg("Order status updated successfully!");
          dispatch(searchOrders({ page: 1, limit: 100, search: searchTerm || undefined, status: statusFilter !== 'all' ? statusFilter : undefined }));
        }
      });
  };


  const searchDebounceRef = useRef(null);
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      const params = {
        page: 1,
        limit: 100,
        search: searchTerm || undefined,
        status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
        dateRange: dateFilter && dateFilter !== 'all' ? dateFilter : undefined,
        sortBy,
        sortOrder
      };
      dispatch(searchOrders(params));
    }, 450);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchTerm, statusFilter, dateFilter, sortBy, sortOrder]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Processing": return isDarkMode ? "bg-yellow-900/50 text-yellow-300" : "bg-yellow-100 text-yellow-800";
      case "Shipped": return isDarkMode ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-800";
      case "Delivered": return isDarkMode ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-800";
      case "Cancelled": return isDarkMode ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-800";
      default: return isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800";
    }
  };


  const getBuyerName = (order) => {
    if (!order) return 'Unknown';
    const b = order.buyer;
    if (b) {
      if (typeof b === 'string' && b.trim()) return b;
      if (typeof b === 'object') {
        if (b.name && b.name !== '-') return b.name;
        if (b.fullName && b.fullName !== '-') return b.fullName;
        if (b.username && b.username !== '-') return b.username;
      }
    }
    if (order.buyerName && order.buyerName !== '-') return order.buyerName;
    if (order.customerName && order.customerName !== '-') return order.customerName;

    if (order.buyerEmail && order.buyerEmail !== '-') return order.buyerEmail;
    if (order.email && order.email !== '-') return order.email;
    return 'Unknown';
  };

  const getBuyerEmail = (order) => {
    if (!order) return 'Unknown';
    const b = order.buyer;
    if (b && typeof b === 'object' && b.email && b.email !== '-') return b.email;
    if (order.buyerEmail && order.buyerEmail !== '-') return order.buyerEmail;
    if (order.email && order.email !== '-') return order.email;
    return 'Unknown';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Processing": return <FiClock className="w-4 h-4" />;
      case "Shipped": return <FiTruck className="w-4 h-4" />;
      case "Delivered": return <FiCheckCircle className="w-4 h-4" />;
      case "Cancelled": return <FiX className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
    setSortBy("createdAt");
    setSortOrder("desc");
  };


  const debugMode = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('debug') === '1';
    } catch (e) {
      return false;
    }
  }, []);

  return (
    <div className={`max-w-6xl mx-auto p-4 pb-32 transition-colors duration-500 ${isDarkMode ? 'text-gray-100 bg-gradient-to-br from-gray-900 via-blue-950 to-purple-950' : ''}`}>
  <div className={`p-6 rounded-2xl mb-8 transition-all ${isDarkMode ? 'bg-gray-800/60 border border-gray-700/30 shadow-lg' : 'bg-gradient-to-br from-white/80 to-indigo-50 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-indigo-100/30'}`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Order Management
            </h2>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Track and manage customer orders</p>
          </div>
          
          <div className="flex gap-3">
          <button
            onClick={() => dispatch(searchOrders({ page: 1, limit: 100, search: searchTerm || undefined, status: statusFilter !== 'all' ? statusFilter : undefined }))}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold"
            disabled={loading}
            title="Refresh Orders"
          >
            <FiRefreshCw className={`${loading ? "animate-spin" : ""} transition-transform`} />
              Refresh
            </button>
          </div>
        </div>

            <div className="mt-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
              <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                id="ordersSearch"
                name="ordersSearch"
                type="text"
                aria-label="Search orders by ID, customer name, or email"
                placeholder="Search orders by ID, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-500'}`}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl border transition-all duration-300 flex items-center gap-2 ${
                  showFilters 
                    ? (isDarkMode ? 'bg-blue-900/50 border-blue-700 text-blue-300' : 'bg-blue-100 border-blue-300 text-blue-700')
                    : (isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')
                }`}
              >
                <FiFilter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

            {showFilters && (
            <div className={`${isDarkMode ? 'bg-gray-800/60 border-gray-700/30' : 'bg-white border-gray-200'} p-4 rounded-xl border space-y-4`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="statusFilter" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                  <select
                    id="statusFilter"
                    name="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'border border-gray-200 bg-white text-gray-800'}`}
                  >
                    <option value="all">All Status</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="dateFilter" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date Range</label>
                  <select
                    id="dateFilter"
                    name="dateFilter"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'border border-gray-200 bg-white text-gray-800'}`}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sortBy" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sort By</label>
                  <div className="flex gap-1">
                    <select
                      id="sortBy"
                      name="sortBy"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className={`flex-1 px-3 py-2 rounded-l-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'border border-gray-200 bg-white text-gray-800'}`}
                    >
                      <option value="createdAt">Date Created</option>
                      <option value="totalAmount">Total Amount</option>
                      <option value="status">Status</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className={`px-3 py-2 rounded-r-lg transition-colors ${isDarkMode ? 'bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-100' : 'border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800'}`}
                    >
                      {sortOrder === "asc" ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quick Actions</div>
                  <div className="flex gap-2">
                    <button
                      onClick={clearFilters}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      Clear Filters
          </button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                  {orders.length} orders found
                </div>
                <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                  Total: ${orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {successMsg && (
        <div className={`px-4 py-3 rounded-lg mb-4 flex items-center gap-2 ${isDarkMode ? 'bg-green-900/20 border border-green-700/20 text-green-300' : 'bg-green-100 border border-green-400 text-green-700'}`}>
          <FiCheckCircle className="w-5 h-5" />
          {successMsg}
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`rounded-xl p-5 flex flex-col gap-3 animate-pulse ${isDarkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-200 shadow-md'}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className={`h-4 w-32 rounded mb-2 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'}`}></div>
                  <div className={`h-3 w-20 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}></div>
                </div>
                <div className={`h-6 w-24 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              </div>
              <div className="flex flex-col gap-1 mb-2">
                <div className={`h-3 w-1/2 rounded mb-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className={`h-3 w-1/3 rounded mb-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}></div>
                <div className={`h-3 w-1/4 rounded mb-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className={`h-3 w-1/2 rounded mb-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}></div>
                <div className={`h-3 w-1/3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              </div>
              <div className="mt-2">
                <div className={`h-4 w-24 rounded mb-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className="overflow-x-auto">
                  <div className={`h-8 w-full rounded mb-1 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}></div>
                  <div className={`h-8 w-5/6 rounded mb-1 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}></div>
                  <div className={`h-8 w-2/3 rounded ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}></div>
                </div>
              </div>
              <div className="mt-2 text-right">
                <div className={`h-6 w-20 rounded ml-auto ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'}`}></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className={`p-4 rounded-xl shadow animate-pulse ${isDarkMode ? 'bg-red-900/30 text-red-300 border border-red-700/30' : 'text-red-600 bg-red-50'}`}>{error}</div>
      ) : orders.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-24 rounded-xl min-h-[300px] ${isDarkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white shadow-md border border-gray-200'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4m-5 4h18" />
          </svg>
          <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No Orders Yet</h3>
          <p className={`mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>You have not received any orders yet. Orders will appear here once buyers make purchases.</p>
          <button
            onClick={() => dispatch(searchOrders({ page: 1, limit: 100, search: searchTerm || undefined, status: statusFilter !== 'all' ? statusFilter : undefined }))}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-semibold"
          >
            Refresh
          </button>
        </div>
      ) : (
        <>
          {orders.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-24 rounded-xl min-h-[300px] ${isDarkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white shadow-md border border-gray-200'}`}>
              <FiSearch className={`h-16 w-16 mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No Orders Found</h3>
              <p className={`mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>No orders match your current search and filter criteria.</p>
              <button
                onClick={clearFilters}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-semibold"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                {orders.map(order => {
                  if (debugMode) {}
                  return (
         <motion.div 
           layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            id={`order-${order._id}`}
            key={order._id} 
            ref={(el) => orderRefs.current.set(order._id, el)}
            className={`rounded-xl shadow-md border p-5 flex flex-col gap-3 hover:shadow-xl hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800/60 border-gray-700 hover:border-blue-600' : 'bg-white border-gray-200 hover:border-blue-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Order #{order._id}</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1 ${getStatusColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </div>
                      <div>
                        {order.status === "Processing" ? (
                          <button
                            className="px-3 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors text-xs"
                            onClick={() => handleStatusUpdate(order._id)}
                            disabled={updating}
                          >
                            {updating ? "..." : "Mark as Shipped"}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}><span className="font-semibold">Buyer:</span> {getBuyerName(order)}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}><span className="font-semibold">Email:</span> {getBuyerEmail(order)}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="font-semibold">Payment:</span> {order.paymentMethod || "-"} ({order.paymentStatus || "-"})
                        {order.paymentInfo && (
                          <div className="mt-1 text-xs">
                            {order.paymentInfo.brand && <span className="mr-2">{order.paymentInfo.brand}</span>}
                            {order.paymentInfo.last4 && <span className="mr-2">{order.paymentInfo.last4}</span>}
                            {order.paymentInfo.expiry && <span className="text-gray-400">Exp: {order.paymentInfo.expiry}</span>}
                          </div>
                        )}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}><span className="font-semibold">Shipping:</span> {order.shippingAddress?.address || "-"}, {order.shippingAddress?.city || "-"}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}><span className="font-semibold">Created:</span> {new Date(order.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="mt-2">
                      <div className={`font-semibold mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Products:</div>
                      <div className="overflow-x-auto">
                        <table className={`min-w-full text-sm rounded ${isDarkMode ? 'bg-transparent' : ''}`}>
                          <thead>
                            <tr className={`${isDarkMode ? 'bg-gray-700/40' : 'bg-gray-100'}`}>
                              <th className="px-2 py-1 text-left">Product</th>
                              <th className="px-2 py-1 text-center">Quantity</th>
                              <th className="px-2 py-1 text-center">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map(item => (
                              <tr key={item.product?._id || item.product} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <td className="px-2 py-1 flex items-center gap-2">
                                  <img
                                    src={item.product?.image && typeof item.product.image === "string" && item.product.image.match(/\.(jpg|jpeg|png|webp)$/i)
                                      ? item.product.image
                                      : "/placeholder-image.webp"}
                                    alt={item.product?.title || "Product"}
                                    className="w-8 h-8 rounded object-cover border mr-2"
                                  />
                                  <span className="font-medium">{item.product?.title || "Deleted"}</span>
                                </td>
                                <td className="px-2 py-1 text-center font-bold">{item.quantity}</td>
                                <td className="px-2 py-1 text-center">${item.product?.price?.toFixed(2) || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className={`text-xs mt-2 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Products: {order.items.length}</div>
                      </div>
                    </div>
                    <div className={`mt-2 text-right font-bold text-lg ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Total: ${order.totalAmount?.toFixed(2) || "-"}</div>
                    {debugMode && (
                      <details className={`mt-3 p-3 rounded text-xs ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
                        <summary className="cursor-pointer font-medium">Raw order JSON</summary>
                        <pre className="whitespace-pre-wrap mt-2 max-h-64 overflow-auto text-[11px]">{JSON.stringify(order, null, 2)}</pre>
                      </details>
                    )}
                  </motion.div>
                );
                })}
                </AnimatePresence>
              </div>
              <div className={`mt-8 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between font-bold text-lg ${isDarkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100'}`}>
                <div className={`flex items-center gap-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  <FiShoppingCart className="w-5 h-5" />
                  Total Orders: {orders.length}
                </div>
                <div className={`flex items-center gap-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                  <FiDollarSign className="w-5 h-5" />
                  Total Sales: ${orders.reduce((sum, order) => sum + ((order.status === 'Delivered') ? (order.totalAmount || 0) : 0), 0).toFixed(2)}
                </div>
              </div>
              {updateError && <div className="text-red-600 mt-2">{updateError}</div>}
            </>
          )}
        </>
      )}
      <style>{`

        html {
          scroll-behavior: smooth;
          scroll-padding-top: 2rem;
        }
      `}</style>
    </div>
  );
}

export default Orders;


