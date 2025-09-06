import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllUsers,
  deleteUser,
  updateUserRole,
  fetchAllOrders,
  fetchAdminStats,
  fetchRecentOrders,
  updateOrderStatus,
  clearAdminError,
  fetchAllProducts,
  deleteProduct
} from '../redux/adminSlice';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// تخصيص مظهر SweetAlert2
const swalCustomStyle = Swal.mixin({
  customClass: {
    confirmButton: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200',
    cancelButton: 'bg-gray-200 text-gray-800 py-2 px-4 rounded-lg shadow-md hover:bg-gray-300 transition-all duration-200 mr-3'
  },
  buttonsStyling: false
});

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const adminState = useSelector((state) => state.admin);
  
  // Safeguard against undefined values with comprehensive fallbacks
  const users = adminState.users || [];
  const orders = adminState.orders || [];
  const products = adminState.products || [];
  const recentOrders = adminState.recentOrders || [];
  const stats = adminState.stats || {
    totalUsers: 0,
    totalOrders: 0,
    totalSales: 0,
    userRoles: { buyer: 0, seller: 0, admin: 0 },
    orderStatus: { Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 },
    salesData: []
  };
  const loading = adminState.loading || false;
  const error = adminState.error || null;

  // UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsModalOpen, setUserDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [roleUpdate, setRoleUpdate] = useState('buyer');
  const [orderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const itemsPerPage = 10;

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await dispatch(fetchAdminStats());
        await Promise.all([
          dispatch(fetchAllUsers()),
          dispatch(fetchAllOrders()),
          dispatch(fetchRecentOrders()),
          dispatch(fetchAllProducts())
        ]);
      } catch (err) {
        console.error('Failed to load data:', err);
        toast.error('Failed to load dashboard data');
      }
    };
    
    loadData();
  }, [dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAdminError());
    }
  }, [error, dispatch]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.role || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentProductPage - 1) * itemsPerPage,
    currentProductPage * itemsPerPage
  );

  // Handle tab change with data loading
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'users' && users.length === 0) {
      dispatch(fetchAllUsers());
    } else if (tab === 'orders' && orders.length === 0) {
      dispatch(fetchAllOrders());
    } else if (tab === 'products' && products.length === 0) {
      dispatch(fetchAllProducts());
    }
  };

  // Handle user deletion with confirmation
  const handleDeleteUser = (userId) => {
    swalCustomStyle.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteUser(userId))
          .unwrap()
          .then(() => {
            toast.success('User deleted successfully');
          })
          .catch((err) => {
            toast.error(`Failed to delete user: ${err.message}`);
          });
      }
    });
  };

  // Handle product deletion with confirmation
  const handleDeleteProduct = (productId) => {
    swalCustomStyle.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteProduct(productId))
          .unwrap()
          .then(() => {
            toast.success('Product deleted successfully');
          })
          .catch((err) => {
            toast.error(`Failed to delete product: ${err.message}`);
          });
      }
    });
  };

  // Handle order status update
  const handleUpdateOrderStatus = (orderId, status) => {
    dispatch(updateOrderStatus({ orderId, status }))
      .unwrap()
      .then(() => {
        toast.success('Order status updated successfully');
      })
      .catch((err) => {
        toast.error(`Failed to update order status: ${err.message}`);
      });
  };

  // Prepare chart data with fallbacks
  const userRolesData = [
    { name: 'Buyers', value: stats.userRoles?.buyer || 0 },
    { name: 'Sellers', value: stats.userRoles?.seller || 0 },
    { name: 'Admins', value: stats.userRoles?.admin || 0 }
  ].filter(item => item.value > 0);

  const orderStatusData = Object.entries({
    Processing: stats.orderStatus?.Processing || 0,
    Shipped: stats.orderStatus?.Shipped || 0,
    Delivered: stats.orderStatus?.Delivered || 0,
    Cancelled: stats.orderStatus?.Cancelled || 0
  })
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0);

  const salesData = stats.salesData?.map(item => {
    const dateObj = new Date(item.date);
    return {
      day: !isNaN(dateObj) ? format(dateObj, 'EEE') : 'N/A',
      sales: item.total || 0
    };
  }) || [
    { day: 'Mon', sales: 0 },
    { day: 'Tue', sales: 0 },
    { day: 'Wed', sales: 0 },
    { day: 'Thu', sales: 0 },
    { day: 'Fri', sales: 0 },
    { day: 'Sat', sales: 0 },
    { day: 'Sun', sales: 0 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const statusColors = {
    Processing: 'bg-yellow-100 text-yellow-800',
    Shipped: 'bg-blue-100 text-blue-800',
    Delivered: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800'
  };

  // Helper to resolve product image with multiple possible shapes and a placeholder fallback
  const getProductImage = (prod) => {
    if (!prod) return '/placeholder-image.webp';
    const first = prod.images?.[0];
    const candidates = [
      first?.url,
      first?.src,
      first,
      prod.image,
      prod.picture,
      prod.thumbnail,
      prod.imageUrl
    ];
    const found = candidates.find((c) => typeof c === 'string' && c.length > 0) || (first && typeof first === 'object' && (first.path || first.filename || first.src || first.url));
    return found || '/placeholder-image.webp';
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-tr from-indigo-500 to-pink-500 text-white p-3 rounded-xl shadow-lg transform-gpu hover:scale-105 transition duration-300 hover:rotate-3"> 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h4l3 7 4-14 3 7h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-sm text-slate-500">Overview, manage users, products and orders with ease</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input
                aria-label="Search admin"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users, products, orders..."
                className="w-full sm:w-80 pl-10 pr-3 py-2 rounded-lg border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all duration-300 focus:shadow-md"
              />
              <div className="absolute left-3 top-2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="bg-white px-3 py-2 rounded-lg shadow-md text-sm text-slate-700 transition-all duration-300 hover:shadow-lg">
                Users: <span className="font-semibold text-indigo-600">{stats.totalUsers || 0}</span>
              </div>
              <div className="bg-white px-3 py-2 rounded-lg shadow-md text-sm text-slate-700 transition-all duration-300 hover:shadow-lg">
                Orders: <span className="font-semibold text-emerald-600">{stats.totalOrders || 0}</span>
              </div>
              <div className="bg-white px-3 py-2 rounded-lg shadow-md text-sm text-slate-700 transition-all duration-300 hover:shadow-lg">
                Sales: <span className="font-semibold text-pink-600">${(stats.totalSales || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <aside className={`lg:col-span-1 bg-white rounded-xl p-4 shadow-md sticky top-6 h-fit transition-all duration-300 ${isSidebarCollapsed ? 'lg:w-20' : ''}`}>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:block mb-4 ml-auto text-slate-400 hover:text-slate-600 transition-colors"
            >
              {isSidebarCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              )}
            </button>
            
            <nav className="flex flex-col gap-2">
              {['dashboard','users','products','orders'].map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`text-left w-full px-3 py-2 rounded-lg transition-all duration-300 flex items-center gap-3 group ${activeTab===tab ? 
                    'bg-gradient-to-r from-indigo-50 to-purple-50 ring-1 ring-indigo-200 text-indigo-700 shadow-sm' : 
                    'hover:bg-slate-50 text-slate-600 hover:shadow-sm'
                  }`}>
                  <span className={`w-2 h-2 rounded-full bg-gradient-to-br from-indigo-400 to-pink-400 transition-all duration-300 ${activeTab===tab ? 'w-3 h-3' : ''}`}></span>
                  {!isSidebarCollapsed && (
                    <>
                      <span className="capitalize font-medium">{tab}</span>
                      <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {tab==='users'? stats.totalUsers : tab==='orders'? stats.totalOrders : tab==='products'? products.length : ''}
                      </span>
                    </>
                  )}
                </button>
              ))}
            </nav>

            {!isSidebarCollapsed && (
              <div className="mt-4 border-t pt-3 text-sm text-slate-500">
                <div className="mb-2 font-medium">Quick Filters</div>
                <select 
                  value={roleFilter} 
                  onChange={e => setRoleFilter(e.target.value)} 
                  className="w-full rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-all duration-200"
                >
                  <option value="">All roles</option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
          </aside>

          {/* Content area */}
          <main className="lg:col-span-3 space-y-6">
            {/* Loading overlay */}
            {loading && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <div className="bg-white/90 p-4 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
                  <div className="animate-spin h-5 w-5 border-2 border-indigo-400 rounded-full border-t-transparent" />
                  <div className="text-slate-700">Loading dashboard...</div>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <section className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white shadow-md transform hover:-translate-y-1 transition-all duration-300 group border border-transparent hover:border-indigo-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-500">Total Users</div>
                        <div className="text-2xl font-bold text-indigo-600">{stats.totalUsers || 0}</div>
                        <div className="text-xs text-slate-400 mt-2">{stats.userRoles?.buyer || 0} buyers • {stats.userRoles?.seller || 0} sellers</div>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-white shadow-md transform hover:-translate-y-1 transition-all duration-300 group border border-transparent hover:border-emerald-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-500">Total Orders</div>
                        <div className="text-2xl font-bold text-emerald-600">{stats.totalOrders || 0}</div>
                        <div className="text-xs text-slate-400 mt-2">Delivered: {stats.orderStatus?.Delivered || 0}</div>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-white shadow-md transform hover:-translate-y-1 transition-all duration-300 group border border-transparent hover:border-pink-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-500">Total Sales</div>
                        <div className="text-2xl font-bold text-pink-600">${(stats.totalSales || 0).toLocaleString()}</div>
                        <div className="text-xs text-slate-400 mt-2">Last 30 days</div>
                      </div>
                      <div className="p-3 bg-pink-50 rounded-lg group-hover:bg-pink-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-md transition-all duration-300 hover:shadow-lg">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      User Distribution
                    </h3>
                    <div className="h-56">
                      {userRolesData.length>0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={userRolesData} dataKey="value" outerRadius={70} innerRadius={30} labelLine={false}>
                              {userRolesData.map((entry, idx)=> <Cell key={idx} fill={COLORS[idx%COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} users`, '']} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : <div className="flex items-center justify-center h-full text-slate-400">No data</div>}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-md transition-all duration-300 hover:shadow-lg">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Order Status
                    </h3>
                    <div className="h-56">
                      {orderStatusData.length>0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={orderStatusData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : <div className="flex items-center justify-center h-full text-slate-400">No data</div>}
                    </div>
                  </div>
                </div>

                {/* Sales Trend */}
                <div className="bg-white p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Sales Trend (Last 7 days)
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip formatter={(v)=>[`$${v}`,'Sales']} />
                        <Line 
                          type="monotone" 
                          dataKey="sales" 
                          stroke={COLORS[0]} 
                          strokeWidth={2} 
                          dot={{ r: 4, fill: COLORS[0] }} 
                          activeDot={{ r: 6, fill: COLORS[0] }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg">
                  <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    Recent Orders
                  </h3>
                  <div className="grid gap-3">
                    {recentOrders.length>0 ? recentOrders.slice(0,6).map(o=> (
                      <div key={o._id} className="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-all duration-200 group">
                        <div>
                          <div className="text-sm font-medium text-indigo-700 group-hover:text-indigo-800 transition-colors">#{o._id?.substring(0, 8)}...</div>
                          <div className="text-xs text-slate-500">{o.buyer?.name || o.buyer?.email || 'Unknown'}</div>
                        </div>
                        <div className="text-sm font-semibold">${o.totalAmount?.toFixed(2)}</div>
                        <div className="ml-4">
                          <button 
                            onClick={()=>{setSelectedOrder(o); setOrderDetailsModalOpen(true)}} 
                            className="text-indigo-600 text-sm underline hover:text-indigo-800 transition-colors flex items-center gap-1"
                          >
                            Details
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )) : <div className="text-slate-400 py-4 text-center">No recent orders</div>}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'users' && (
              <section className="bg-white p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Users ({users.length})
                  </h2>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input 
                      placeholder="Search users..." 
                      className="px-3 py-1.5 border rounded-md text-sm w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-all duration-200" 
                      value={searchTerm} 
                      onChange={e=>setSearchTerm(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="text-slate-500 text-xs uppercase bg-slate-50">
                      <tr>
                        <th className="py-3 px-4 text-left font-medium">Name</th>
                        <th className="py-3 px-4 text-left font-medium">Email</th>
                        <th className="py-3 px-4 text-center font-medium">Role</th>
                        <th className="py-3 px-4 text-center font-medium">Joined</th>
                        <th className="py-3 px-4 text-center font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedUsers.map(u=> (
                        <tr key={u._id} className="hover:bg-slate-50 transition-colors group">
                          <td className="py-3 px-4"> 
                            <button 
                              className="text-indigo-600 hover:text-indigo-800 transition-colors font-medium text-left flex items-center gap-2 group-hover:underline" 
                              onClick={()=>{setSelectedUser(u); setUserDetailsModalOpen(true)}}
                            >
                              {u.username || u.name || u.email}
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{u.email}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role==='admin'?'bg-purple-100 text-purple-700':u.role==='seller'?'bg-blue-100 text-blue-700':'bg-emerald-100 text-emerald-700'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-center">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <button 
                                onClick={()=>handleDeleteUser(u._id)} 
                                className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-1 text-xs font-medium"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <button 
                    disabled={currentPage===1} 
                    onClick={() => setCurrentPage(p => p - 1)} 
                    className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-all ${currentPage===1 ?
                      'bg-slate-100 text-slate-400 cursor-not-allowed' :
                      'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 shadow-sm'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <div className="text-sm text-slate-600">Page {currentPage} of {totalPages}</div>
                  <button 
                    disabled={currentPage===totalPages} 
                    onClick={()=>setCurrentPage(p=>p+1)} 
                    className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-all ${currentPage===totalPages?
                      'bg-slate-100 text-slate-400 cursor-not-allowed' :
                      'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 shadow-sm'}`}
                  >
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </section>
            )}

            {activeTab === 'products' && (
              <section className="bg-white p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Products ({products.length})
                  </h2>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input 
                      placeholder="Search products..." 
                      className="px-3 py-1.5 border rounded-md text-sm w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-emerald-300 transition-all duration-200" 
                      value={productSearchTerm} 
                      onChange={e=>setProductSearchTerm(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="text-slate-500 text-xs uppercase bg-slate-50">
                      <tr>
                        <th className="py-3 px-4 text-left font-medium">Product</th>
                        <th className="py-3 px-4 text-left font-medium">Category</th>
                        <th className="py-3 px-4 text-center font-medium">Price</th>
                        <th className="py-3 px-4 text-center font-medium">Stock</th>
                        <th className="py-3 px-4 text-center font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedProducts.map(p=> (
                        <tr key={p._id} className="hover:bg-slate-50 transition-colors group">
                          <td className="py-3 px-4"> 
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden">
                                {p.images?.[0] ? (
                                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-slate-800 group-hover:text-indigo-700 transition-colors">{p.title}</div>
                                <div className="text-xs text-slate-500">{p.description?.substring(0, 30)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 capitalize">{p.category}</td>
                          <td className="py-3 px-4 text-center font-medium text-emerald-600">${p.price?.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.stock>10?'bg-emerald-100 text-emerald-700':p.stock>0?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>
                              {p.stock || 0} in stock
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <button 
                                onClick={()=>handleDeleteProduct(p._id)} 
                                className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-1 text-xs font-medium"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <button 
                    disabled={currentProductPage===1} 
                    onClick={()=>setCurrentProductPage(p=>p-1)} 
                    className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-all ${currentProductPage===1?
                      'bg-slate-100 text-slate-400 cursor-not-allowed' :
                      'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-sm'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <div className="text-sm text-slate-600">Page {currentProductPage} of {totalProductPages}</div>
                  <button 
                    disabled={currentProductPage===totalProductPages} 
                    onClick={()=>setCurrentProductPage(p=>p+1)} 
                    className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-all ${currentProductPage===totalProductPages?
                      'bg-slate-100 text-slate-400 cursor-not-allowed' :
                      'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-sm'}`}
                  >
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </section>
            )}

            {activeTab === 'orders' && (
              <section className="bg-white p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Orders ({orders.length})
                  </h2>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="text-slate-500 text-xs uppercase bg-slate-50">
                      <tr>
                        <th className="py-3 px-4 text-left font-medium">Order ID</th>
                        <th className="py-3 px-4 text-left font-medium">Customer</th>
                        <th className="py-3 px-4 text-center font-medium">Amount</th>
                        <th className="py-3 px-4 text-center font-medium">Status</th>
                        <th className="py-3 px-4 text-center font-medium">Date</th>
                        <th className="py-3 px-4 text-center font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map(o=> (
                        <tr key={o._id} className="hover:bg-slate-50 transition-colors group">
                          <td className="py-3 px-4"> 
                            <div className="text-indigo-600 font-medium">#{o._id?.substring(0, 8)}...</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-800">{o.buyer?.name || o.buyer?.email || 'Unknown'}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-emerald-600">${o.totalAmount?.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            <select 
                              value={o.status} 
                              onChange={e=>handleUpdateOrderStatus(o._id, e.target.value)} 
                              className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-1 focus:ring-indigo-300 ${statusColors[o.status] || 'bg-gray-100 text-gray-800'}`}
                            >
                              <option value="Processing" className="bg-yellow-100 text-yellow-800">Processing</option>
                              <option value="Shipped" className="bg-blue-100 text-blue-800">Shipped</option>
                              <option value="Delivered" className="bg-green-100 text-green-800">Delivered</option>
                              <option value="Cancelled" className="bg-red-100 text-red-800">Cancelled</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-center">{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-center">
                            <button 
                              onClick={()=>{setSelectedOrder(o); setOrderDetailsModalOpen(true)}} 
                              className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 text-xs font-medium"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* User Details Modal */}
      <Modal
        isOpen={userDetailsModalOpen}
        onRequestClose={() => setUserDetailsModalOpen(false)}
        className="bg-white p-6 rounded-xl shadow-xl max-w-lg mx-auto mt-20 outline-none"
        overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      >
        {selectedUser && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">User Details</h3>
              <button onClick={() => setUserDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-300 to-purple-400 flex items-center justify-center text-white text-xl font-bold">
                  {(selectedUser.name || selectedUser.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{selectedUser.name || selectedUser.username || 'No name'}</div>
                  <div className="text-sm text-slate-500">{selectedUser.email}</div>
                  <div className="text-xs mt-1">
                    <span className={`px-2 py-0.5 rounded-full ${selectedUser.role==='admin'?'bg-purple-100 text-purple-700':selectedUser.role==='seller'?'bg-blue-100 text-blue-700':'bg-emerald-100 text-emerald-700'}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-500">User ID</div>
                  <div className="text-slate-800 font-mono text-xs">{selectedUser._id}</div>
                </div>
                <div>
                  <div className="text-slate-500">Joined</div>
                  <div className="text-slate-800">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="text-sm font-medium text-slate-700 mb-2">Update Role</div>
                <div className="flex gap-2">
                  <select 
                    value={roleUpdate} 
                    onChange={e => setRoleUpdate(e.target.value)} 
                    className="px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-all duration-200"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button 
                    onClick={() => {
                      dispatch(updateUserRole({ userId: selectedUser._id, role: roleUpdate }))
                        .unwrap()
                        .then(() => {
                          toast.success('User role updated successfully');
                          setUserDetailsModalOpen(false);
                        })
                        .catch(err => {
                          toast.error(`Failed to update role: ${err.message}`);
                        });
                    }} 
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Order Details Modal */}
      <Modal
        isOpen={orderDetailsModalOpen}
        onRequestClose={() => setOrderDetailsModalOpen(false)}
        className="bg-white p-6 rounded-xl shadow-xl max-w-2xl mx-auto mt-20 outline-none max-h-[80vh] overflow-y-auto"
        overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      >
        {selectedOrder && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Order Details</h3>
              <button onClick={() => setOrderDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-500">Order ID</div>
                  <div className="text-slate-800 font-mono">{selectedOrder._id}</div>
                </div>
                <div>
                  <div className="text-slate-500">Order Date</div>
                  <div className="text-slate-800">{new Date(selectedOrder.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-slate-500">Customer</div>
                  <div className="text-slate-800">{selectedOrder.buyer?.name || selectedOrder.buyer?.email || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-slate-500">Status</div>
                  <div className="text-slate-800">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[selectedOrder.status] || 'bg-gray-100 text-gray-800'}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium text-slate-700 mb-2">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map(item => (
                    <div key={item._id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-slate-200 overflow-hidden">
                          {item.product?.images?.[0] ? (
                            <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">{item.product?.title || 'Unknown Product'}</div>
                          <div className="text-xs text-slate-500">Qty: {item.quantity}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-emerald-600">${item.price?.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-slate-500">Total Amount</div>
                  <div className="text-lg font-bold text-emerald-600">${selectedOrder.totalAmount?.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}