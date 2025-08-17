import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from "react-router-dom";

export default function SellerDashboard() {
  const { token, user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    productsCount: 0,
    ordersCount: 0,
    totalSales: 0,
    recentOrders: [],
    salesData: [],
    popularProducts: [],
    stockAlerts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const [statsRes, salesRes, popularRes] = await Promise.all([
          axios.get("/api/products/seller/dashboard", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/api/products/seller/sales-data", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/api/products/seller/popular", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);


        setStats({
          ...statsRes.data,
          salesData: salesRes.data,
          popularProducts: popularRes.data,
          recentOrders: statsRes.data.recentOrders || []
        });
      } catch (err) {
        console.error("Error fetching seller stats:", err);
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto p-4">
  <h1 className="text-4xl font-extrabold mb-8 text-gray-900 tracking-tight drop-shadow">Seller Dashboard</h1>

  <div className="flex flex-row flex-nowrap overflow-x-auto gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-8 mb-10 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
          {/* Products Card */}
          <div
            className="bg-white p-7 rounded-2xl shadow-lg border border-gray-100 md:transition-transform md:hover:scale-105 md:hover:shadow-2xl cursor-pointer min-w-[260px] md:min-w-0"
            onClick={() => navigate("/seller/my-products")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-base font-semibold">Products</p>
                <h3 className="text-3xl font-extrabold text-blue-600 mt-2">
                  {stats.productsCount}
                </h3>
              </div>
              <div className="p-4 bg-blue-100 rounded-full">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Orders Card */}


          <div
            className="bg-white p-7 rounded-2xl shadow-lg border border-gray-100 md:transition-transform md:hover:scale-105 md:hover:shadow-2xl cursor-pointer min-w-[260px] md:min-w-0"
            onClick={() => navigate("/seller/orders")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-base font-semibold">Orders</p>
                <h3 className="text-3xl font-extrabold text-green-600 mt-2">
                  {stats.ordersCount}
                </h3>
              </div>
              <div className="p-4 bg-green-100 rounded-full">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>


          <div className="bg-white p-7 rounded-2xl shadow-lg border border-gray-100 min-w-[260px] md:min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-base font-semibold">Total Sales</p>
                <h3 className="text-3xl font-extrabold text-purple-600 mt-2">
                  ${Number(stats.totalSales || 0).toFixed(2)}
                </h3>
              </div>
              <div className="p-4 bg-purple-100 rounded-full">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Stock Alerts Card */}
          <div className="bg-white p-7 rounded-2xl shadow-lg border border-gray-100 min-w-[260px] md:min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-base font-semibold">Stock Alerts</p>
                <h3 className="text-3xl font-extrabold text-yellow-600 mt-2">
                  {Array.isArray(stats.stockAlerts) ? stats.stockAlerts.length : 0}
                </h3>
              </div>
              <div className="p-4 bg-yellow-100 rounded-full">
                <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-white p-7 rounded-2xl shadow-lg border border-gray-100 mb-10">
          <h3 className="text-xl font-bold mb-5 text-gray-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v18h18" /></svg>
            Sales Chart
          </h3>
          {stats.salesData && stats.salesData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#6366f1" name="Sales" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500">No sales data available</p>
          )}
        </div>

        {Array.isArray(stats.stockAlerts) && stats.stockAlerts.length > 0 && (
          <div className="bg-white p-7 rounded-2xl shadow-lg border border-red-100 mb-10">
            <h3 className="text-xl font-bold mb-5 text-red-600 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Stock Alerts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.stockAlerts.map((product) => (
                <div key={product._id} className="flex items-center p-4 border border-red-200 rounded-xl bg-red-50 hover:bg-red-100 transition">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-16 h-16 rounded object-cover mr-3 shadow"
                  />
                  <div>
                    <h4 className="font-bold text-gray-800">{product.title}</h4>
                    <p className="text-sm text-red-600 font-semibold">Remaining: {product.quantity}</p>
                    <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-semibold underline">
                      Update Stock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.popularProducts && stats.popularProducts.length > 0 && (
          <div className="bg-white p-7 rounded-2xl shadow-lg border border-gray-100 mb-10">
            <h3 className="text-xl font-bold mb-5 text-gray-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 01-8 0" /></svg>
              Best Selling Products
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.popularProducts.map((product) => {
                let imgSrc = product.image;
                let hasImage = !!imgSrc;
                if (!imgSrc) {
                  imgSrc = "/placeholder.png";
                } else if (!imgSrc.startsWith("http")) {
                  if (imgSrc.startsWith("/uploads")) {
                    imgSrc = imgSrc;
                  } else {
                    imgSrc = `/uploads/${imgSrc}`;
                  }
                }
                return (
                  <div key={product._id} className="flex items-center p-4 border border-gray-200 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition">
                    <img
                      src={imgSrc}
                      alt={product.title}
                      onError={(e) => { e.target.src = "/placeholder.png"; }}
                      className="w-16 h-16 rounded object-cover mr-3 shadow"
                    />
                    <div>
                      <h4 className="font-bold text-gray-800">{product.title}</h4>
                      <p className="text-sm text-gray-600 font-semibold">Price: ${product.price}</p>
                      {!hasImage && (
                        <span className="text-xs text-red-500">No image for this product</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}