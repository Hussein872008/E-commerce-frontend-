import { useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useNavigate } from "react-router-dom";
import { FiTrendingUp, FiTrendingDown, FiEye, FiShoppingCart, FiPackage, FiDollarSign, FiUsers, FiStar, FiAlertTriangle, FiClock, FiCheckCircle } from 'react-icons/fi';
import { fetchSellerDashboardStats, fetchSellerSalesData, fetchSellerPopularProducts } from '../../redux/productSlice';

export default function SellerDashboard() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const isDarkMode = useSelector((state) => state.theme.darkMode);
  const [statHover, setStatHover] = useState({ 0: false, 1: false });

  const smoothScrollTo = (el, offset = 80) => {
    if (!el) return;
    try {
      const rect = el.getBoundingClientRect();
      const top = window.pageYOffset + rect.top - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    } catch (e) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const { 
    sellerDashboardStats, 
    sellerSalesData, 
    sellerPopularProducts, 
    loading, 
    error 
  } = useSelector((state) => state.products);
  
  const navigate = useNavigate();
  const stockAlertsRef = useRef(null);

  const handleAlertsClick = () => {
    const alerts = sellerDashboardStats?.stockAlerts;
    if (Array.isArray(alerts) && alerts.length > 0) {
  smoothScrollTo(stockAlertsRef.current, 96);
      try { stockAlertsRef.current?.focus(); } catch (e) {}
      return;
    }
    navigate("/seller/orders");
  };

  useEffect(() => {
    if (token) {
      dispatch(fetchSellerDashboardStats());
      dispatch(fetchSellerSalesData());
      dispatch(fetchSellerPopularProducts());
    }
  }, [dispatch, token]);

  const chartData = Array.isArray(sellerSalesData)
    ? [...sellerSalesData].sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  const formatDate = (d) => {
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString();
    } catch (e) {
      return d;
    }
  };

  const chartDisplayData = chartData.map((entry, idx) => ({
    label: `${formatDate(entry.date)}${entry.orderId ? ` #${String(entry.orderId).slice(-4)}` : ` #${idx + 1}`}`,
    ...entry,
  }));

  const alertsCount = Array.isArray(sellerDashboardStats?.stockAlerts) ? sellerDashboardStats.stockAlerts.length : 0;

  if (loading) {
    return (
      <div className={`min-h-screen py-8 pb-32 transition-colors duration-500 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
        <div className="container mx-auto p-4">
          <h1 className="text-4xl font-extrabold mb-8">
            <span className={`inline-block h-10 w-64 rounded bg-gray-300/70 ${isDarkMode ? 'bg-gray-700/60' : 'bg-gray-200'} animate-pulse`} />
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => {
              const isStatCard = i === 0 || i === 1;
                const isHovered = !!statHover[i];
                const shouldPulse = isStatCard ? !isHovered : true;
                return (
                  <div
                    key={i}
                    onMouseEnter={() => { if (isStatCard) setStatHover(s => ({ ...s, [i]: true })); }}
                    onMouseLeave={() => { if (isStatCard) setStatHover(s => ({ ...s, [i]: false })); }}
                    className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800/60' : 'bg-white'} border ${isDarkMode ? 'border-gray-700/30' : 'border-gray-100'} shadow-sm ${shouldPulse ? 'animate-pulse' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 w-2/3">
                        <div className={`h-4 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                        <div className={`h-8 w-24 rounded mt-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      </div>
                      <div className={`h-12 w-12 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    </div>
                  </div>
                );
            })}
          </div>

          <div className={`p-6 rounded-2xl transition-all duration-300 mb-10 ${isDarkMode ? 'bg-gray-800/60' : 'bg-white'}`}>
            <div className="mb-5">
              <div className={`h-6 w-48 rounded bg-gray-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`} />
            </div>
            <div className="h-80 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className={`flex items-center p-4 border rounded-xl transition ${isDarkMode ? 'bg-gray-800/60 border-gray-700/30' : 'bg-white border-gray-100'} animate-pulse`}>
                <div className={`w-16 h-16 rounded object-cover mr-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <div className="flex-1">
                  <div className={`h-4 w-40 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  <div className={`h-3 w-24 rounded mt-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-4">
        {error}
      </div>
    );
  }


  return (
    <div className={`min-h-screen py-8 pb-32 transition-colors duration-500 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-blue-950 to-purple-950 text-gray-100' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-800'}`}>
      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-extrabold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Seller Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-2xl transition-all duration-300  cursor-pointer ${isDarkMode ? 'bg-gray-800/60 border border-gray-700/30 shadow-lg' : 'bg-gradient-to-br from-white to-blue-50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-blue-100/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]'}`} onClick={() => navigate("/seller/my-products") }>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-base font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Products</p>
                 <h3 className="text-3xl font-extrabold text-blue-600 mt-2">
                   {sellerDashboardStats.productsCount || 0}
                 </h3>
              </div>
              <div className={`p-4 rounded-full ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>



          <div
            className={`p-6 rounded-2xl transition-all duration-300  cursor-pointer ${isDarkMode ? 'bg-gray-800/60 border border-gray-700/30 shadow-lg' : 'bg-gradient-to-br from-white to-blue-50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-blue-100/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]'}`}
            onClick={() => navigate("/seller/orders")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-base font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Orders</p>
                 <h3 className="text-3xl font-extrabold text-green-600 mt-2">
                   {sellerDashboardStats.ordersCount || 0}
                 </h3>
              </div>
              <div className={`p-4 rounded-full ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>


          <div className={`p-6 rounded-2xl transition-all duration-300 ${isDarkMode ? 'bg-gray-800/60 border border-gray-700/30 shadow-lg' : 'bg-gradient-to-br from-white to-blue-50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-blue-100/50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-base font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Sales</p>
                 <h3 className="text-3xl font-extrabold text-purple-600 mt-2">
                   ${Number(sellerDashboardStats.totalSales || 0).toFixed(2)}
                 </h3>
              </div>
              <div className={`p-4 rounded-full ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {alertsCount > 0 ? (
            <div
              role="button"
              tabIndex={0}
              onClick={handleAlertsClick}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAlertsClick(); } }}
              className={`p-6 rounded-2xl transition-all duration-300 cursor-pointer ${isDarkMode ? 'bg-gray-800/60 border border-gray-700/30 shadow-lg' : 'bg-gradient-to-br from-white to-blue-50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-blue-100/50'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-base font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Stock Alerts</p>
                   <h3 className="text-3xl font-extrabold text-yellow-500 mt-2">
                     {alertsCount}
                   </h3>
                </div>
                <div className={`p-4 rounded-full ${isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'}`}>
                  <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-6 rounded-2xl transition-all duration-300 ${isDarkMode ? 'bg-gray-800/40 border border-gray-700/10' : 'bg-white border border-blue-50/40'}`} aria-hidden="true">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-base font-semibold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Stock Alerts</p>
                   <h3 className="text-3xl font-extrabold text-yellow-400 mt-2">
                     {alertsCount}
                   </h3>
                </div>
                <div className={`p-4 rounded-full ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
                  <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

  <div className={`p-6 rounded-2xl transition-all duration-300 mb-10 ${isDarkMode ? 'bg-gray-800/60 border border-gray-700/30 shadow-lg' : 'bg-gradient-to-br from-white to-blue-50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-blue-100/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]'}`}>
          <h3 className={`text-xl font-bold mb-5 flex items-center gap-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v18h18" /></svg>
            Sales Chart
          </h3>
           {chartDisplayData && chartDisplayData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDisplayData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4A5568' : '#E2E8F0'} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: isDarkMode ? '#A0AEC0' : '#4A5568' }} />
                  <YAxis tick={{ fill: isDarkMode ? '#A0AEC0' : '#4A5568' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? 'rgba(26, 32, 44, 0.8)' : 'white',
                      borderColor: isDarkMode ? '#4A5568' : '#E2E8F0',
                      color: isDarkMode ? '#E2E8F0' : '#1A202C'
                    }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Sales']}
                    labelFormatter={(label) => label}
                  />
                  <Legend wrapperStyle={{ color: isDarkMode ? '#A0AEC0' : '#4A5568' }} />
                  <Bar dataKey="total" fill="#6366f1" name="Sales" barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500">No sales data available</p>
          )}
        </div>

         {Array.isArray(sellerDashboardStats.stockAlerts) && sellerDashboardStats.stockAlerts.length > 0 && (
          <div ref={stockAlertsRef} tabIndex={-1} className={`p-7 rounded-2xl transition-all mb-10 ${isDarkMode ? 'bg-gray-800/60 border border-red-700/20 shadow-lg' : 'bg-white p-7 rounded-2xl shadow-lg border border-red-100'}`}>
            <h3 className="text-xl font-bold mb-5 text-red-500 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Stock Alerts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {sellerDashboardStats.stockAlerts.map((product) => (
                <div key={product._id} className={`flex items-center p-4 border rounded-xl transition ${isDarkMode ? 'bg-red-900/20 border-red-700/30 hover:bg-red-900/40' : 'bg-red-50 border-red-200 hover:bg-red-100'}`}>
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-16 h-16 rounded object-cover mr-3 shadow"
                  />
                  <div>
                    <h4 className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{product.title}</h4>
                    <p className="text-sm text-red-500 font-semibold">Remaining: {product.quantity}</p>
                    <button
                      onClick={() => navigate(`/seller/edit-product/${product._id}`)}
                      className="mt-2 text-sm text-blue-500 hover:text-blue-400 font-semibold underline"
                      aria-label={`Update stock for ${product.title}`}
                    >
                      Update Stock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

         {sellerPopularProducts && sellerPopularProducts.length > 0 && (
          <div className={`p-7 rounded-2xl transition-all mb-10 ${isDarkMode ? 'bg-gray-800/60 border border-gray-700/30 shadow-lg' : 'bg-white p-7 rounded-2xl shadow-lg border border-gray-100'}`}>
            <h3 className={`text-xl font-bold mb-5 flex items-center gap-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 01-8 0" /></svg>
              Best Selling Products
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {sellerPopularProducts.map((product) => {
                let imgSrc = product.image;
                let hasImage = !!imgSrc;
                if (!imgSrc) {
                  imgSrc = "/placeholder.png";
                } else if (!imgSrc.startsWith("http")) {
                  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';
                  const filename = imgSrc.startsWith('/uploads') ? imgSrc.split('/').pop() : imgSrc;
                  imgSrc = `${base}/uploads/${filename}`;
                }
                return (
                  <button
                    key={product._id}
                    onClick={() => navigate(`/seller/my-products?highlight=${product._id}`)}
                    title={`View ${product.title} in My Products`}
                    aria-label={`View ${product.title} in My Products`}
                    className={`w-full text-left flex items-center p-4 border rounded-xl transition ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700/30 hover:bg-yellow-900/40' : 'bg-yellow-50 border-gray-200 hover:bg-yellow-100'}`}
                  >
                    <img
                      src={imgSrc}
                      alt={product.title}
                      onError={(e) => { e.target.src = "/placeholder.png"; }}
                      className="w-16 h-16 rounded object-cover mr-3 shadow"
                    />
                    <div>
                      <h4 className={`font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{product.title}</h4>
                      <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Price: ${product.price}</p>
                      {!hasImage && (
                        <span className="text-xs text-red-500">No image for this product</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}