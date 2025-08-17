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

  // Handle user deletion with SweetAlert confirmation
  const handleDeleteUser = (userId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
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

  // Handle product deletion with SweetAlert confirmation
  const handleDeleteProduct = (productId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
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

  // Handle role update

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

  // Dynamic sales data from stats
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

  return (
  <div className="p-2 sm:p-4 md:p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen w-full">
  <div className="max-w-7xl mx-auto w-full">
  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6 sm:mb-8 flex items-center gap-2">
          <span className="inline-block p-2 bg-gradient-to-tr from-blue-400 to-purple-400 rounded-full shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </span>
          Admin Dashboard
        </h1>
        
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <p className="text-lg">Loading...</p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
  <div className="flex flex-row flex-nowrap overflow-x-auto border-b mb-4 sm:mb-6 sticky top-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-30 gap-2 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
          <button
            className={`px-4 py-2 font-medium transition-all duration-300 rounded-t-lg ${activeTab === 'dashboard' ? 'border-b-2 border-blue-500 text-blue-600 bg-white shadow' : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'}`}
            onClick={() => handleTabChange('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`px-4 py-2 font-medium transition-all duration-300 rounded-t-lg ${activeTab === 'users' ? 'border-b-2 border-blue-500 text-blue-600 bg-white shadow' : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'}`}
            onClick={() => handleTabChange('users')}
          >
            Users ({stats.totalUsers || 0})
          </button>
          <button
            className={`px-4 py-2 font-medium transition-all duration-300 rounded-t-lg ${activeTab === 'products' ? 'border-b-2 border-blue-500 text-blue-600 bg-white shadow' : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'}`}
            onClick={() => handleTabChange('products')}
          >
            Products ({products.length || 0})
          </button>
          <button
            className={`px-4 py-2 font-medium transition-all duration-300 rounded-t-lg ${activeTab === 'orders' ? 'border-b-2 border-blue-500 text-blue-600 bg-white shadow' : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'}`}
            onClick={() => handleTabChange('orders')}
          >
            Orders ({stats.totalOrders || 0})
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
                    <p className="text-3xl font-bold text-blue-600">
                      {stats?.totalUsers?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {stats?.userRoles?.buyer || 0} Buyers • {stats?.userRoles?.seller || 0} Sellers • {stats?.userRoles?.admin || 0} Admins
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Total Orders</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {stats?.totalOrders?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {stats?.orderStatus?.Delivered || 0} Delivered • {stats?.orderStatus?.Processing || 0} Processing
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Total Sales</h3>
                    <p className="text-3xl font-bold text-purple-600">
                      ${(stats?.totalSales || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Last 30 days
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* User Roles Pie Chart */}
              <div className="bg-white p-6 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">User Distribution</h3>
                <div className="h-64">
                  {userRolesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userRolesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {userRolesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">No user data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Status Bar Chart */}
              <div className="bg-white p-6 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Order Status</h3>
                <div className="h-64">
                  {orderStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={orderStatusData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">No order data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sales Trend Line Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 mb-6 sm:mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Sales Trend (Last 7 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300">
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-4">Recent Orders</h3>
              <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-blue-50 transition-all duration-200 cursor-pointer">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 font-bold underline cursor-pointer" title={order._id}
                            onClick={() => { setSelectedOrder(order); setOrderDetailsModalOpen(true); }}>
                            #{order._id || 'N/A'}
                          </td>
      {/* Order Details Modal (English) */}
      <Modal
        isOpen={orderDetailsModalOpen}
        onRequestClose={() => setOrderDetailsModalOpen(false)}
        contentLabel="Order Details"
        className="fixed inset-0 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
      >
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full relative">
          <button
            onClick={() => setOrderDetailsModalOpen(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
          >
            &times;
          </button>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            Order Details
          </h2>
          {selectedOrder && (
            <>
              <div className="mb-2"><span className="font-semibold">Order ID:</span> {selectedOrder._id}</div>
              <div className="mb-2"><span className="font-semibold">Customer:</span> {selectedOrder.buyer?.name || selectedOrder.buyer?.username || selectedOrder.buyer?.email || 'Unknown'}</div>
              <div className="mb-2"><span className="font-semibold">Status:</span> {selectedOrder.status}</div>
              <div className="mb-2"><span className="font-semibold">Created At:</span> {new Date(selectedOrder.createdAt).toLocaleDateString()}</div>
              <div className="mb-2"><span className="font-semibold">Products:</span>
                {Array.isArray(selectedOrder.products) && selectedOrder.products.length > 0 ? (
                  <ul className="list-disc pl-4">
                    {selectedOrder.products.map((prod, idx) => (
                      <li key={idx}>{prod.title || prod.name || (prod.product && (prod.product.title || prod.product.name)) || 'Product'} × {prod.quantity || 1}</li>
                    ))}
                  </ul>
                ) : Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  <ul className="list-disc pl-4">
                    {selectedOrder.items.map((item, idx) => (
                      <li key={idx}>{item.title || item.name || (item.product && (item.product.title || item.product.name)) || 'Product'} × {item.quantity || 1}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-400 ml-2">No products in this order</span>
                )}
              </div>
              <div className="mb-2"><span className="font-semibold">Amount:</span> ${selectedOrder.totalAmount?.toFixed(2)}</div>
              <div className="mb-2"><span className="font-semibold">Payment:</span> {selectedOrder.paymentMethod || selectedOrder.paymentStatus || 'N/A'}</div>
            </>
          )}
        </div>
      </Modal>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.buyer?.name  || order.buyer?.email || order.buyer?.fullName || order.buyer?.userName || order.buyer?.user?.name || order.buyer?.user?.username || order.buyer?.user?.email || 'Unknown Buyer'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.totalAmount.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                          No recent orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white p-2 sm:p-6 rounded-xl shadow-lg sm:hover:scale-105 sm:hover:shadow-2xl transition-all duration-300 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-2 sm:mb-4 gap-2">
              <h2 className="text-xl font-semibold text-gray-800">User Management ({users.length})</h2>
              <div className="flex flex-row gap-2 w-full sm:w-auto items-center">
                <div className="relative w-full sm:w-56">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="px-2 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-500 min-w-[110px]"
                >
                  <option value="">All Roles</option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {users.length === 0 && !loading ? (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="mt-2 text-gray-500">No users found</p>
              </div>
            ) : (
              <>
                <div className="w-full">
                  {/* Mobile: Card layout */}
                  <div className="block sm:hidden">
                    {paginatedUsers.map((user) => (
                      <div key={user._id} className="bg-white rounded-lg shadow mb-2 p-3 flex flex-col gap-2 sm:hover:scale-105 sm:hover:shadow-2xl sm:transition-all sm:duration-300">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{user.username || user.name || user.email || user._id}</span>
                          <button
                            className="text-blue-600 text-xs underline"
                            onClick={() => {
                              setSelectedUser(user);
                              setUserDetailsModalOpen(true);
                            }}
                          >Details</button>
                        </div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                        <div>
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                              user.role === 'seller' ? 'bg-blue-100 text-blue-800' : 
                              'bg-green-100 text-green-800'}`}
                          >
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </div>
                        <div className="text-gray-500 text-xs">Joined: {new Date(user.createdAt).toLocaleDateString()}</div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 hover:text-red-900 text-xs"
                          >Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop: Table layout */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedUsers.map((user) => (
                          <tr key={user._id} className="hover:bg-purple-50 transition-all duration-200 cursor-pointer">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="ml-2">
                                  <button
                                    className="text-sm font-medium text-blue-600 hover:underline focus:outline-none"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setUserDetailsModalOpen(true);
                                    }}
                                  >
                                    {user.username || user.name || user.email || user._id}
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                  user.role === 'seller' ? 'bg-blue-100 text-blue-800' : 
                                  'bg-green-100 text-green-800'}`}
                              >
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-red-600 hover:text-red-900 transition-colors duration-200"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className={`px-4 py-2 rounded transition-colors duration-200 ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className={`px-4 py-2 rounded transition-colors duration-200 ${currentPage >= totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
            {/* User Details Modal */}
            <Modal
              isOpen={userDetailsModalOpen}
              onRequestClose={() => setUserDetailsModalOpen(false)}
              contentLabel="User Details"
              className="fixed inset-0 flex items-center justify-center z-50"
              overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
            >
              <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full relative">
                <button
                  onClick={() => setUserDetailsModalOpen(false)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                >
                  &times;
                </button>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">User Details</h2>
                {selectedUser && (
                  <>
                    <div className="mb-2"><span className="font-semibold">Name:</span> {selectedUser.username || selectedUser.name || selectedUser.email || selectedUser._id}</div>
                    <div className="mb-2"><span className="font-semibold">Email:</span> {selectedUser.email}</div>
                    <div className="mb-2"><span className="font-semibold">Role:</span> {selectedUser.role}</div>
                    <div className="mb-2"><span className="font-semibold">Joined:</span> {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                  </>
                )}
              </div>
            </Modal>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white p-2 sm:p-6 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-2 sm:mb-4 gap-2">
              <h2 className="text-xl font-semibold text-gray-800">Product Management ({products.length})</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {products.length === 0 && !loading ? (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="mt-2 text-gray-500">No products found</p>
              </div>
            ) : (
              <>
                <div className="w-full">
                  {/* Mobile: Card layout */}
                  <div className="block sm:hidden">
                    {paginatedProducts.map((product) => (
                      <div key={product._id} className="bg-white rounded-lg shadow mb-2 p-3 flex flex-col gap-2 sm:hover:scale-105 sm:hover:shadow-2xl sm:transition-all sm:duration-300">
                        <div className="flex items-center gap-2">
                          <img className="h-10 w-10 rounded" src={product.image} alt={product.title} />
                          <span className="font-semibold">{product.title}</span>
                        </div>
                        <div className="text-gray-500 text-xs">Category: {product.category}</div>
                        <div className="text-gray-500 text-xs">Price: ${product.price.toFixed(2)}</div>
                        <div className="text-gray-500 text-xs">Stock: {product.quantity}</div>
                        <div className="text-gray-500 text-xs">Seller: {product.seller?.username || product.seller?.name || product.seller?.email || product.seller?.fullName || product.seller?.userName || product.seller?.user?.name || product.seller?.user?.username || product.seller?.user?.email || 'Unknown Seller'}</div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="text-red-600 hover:text-red-900 text-xs"
                          >Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop: Table layout */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedProducts.map((product) => (
                          <tr key={product._id} className="hover:bg-green-50 transition-all duration-200 cursor-pointer">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded" src={product.image} alt={product.title} />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{product.title}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                              {product.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${product.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.seller?.username || product.seller?.name || product.seller?.email || product.seller?.fullName || product.seller?.userName || product.seller?.user?.name || product.seller?.user?.username || product.seller?.user?.email || 'Unknown Seller'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleDeleteProduct(product._id)}
                                className="text-red-600 hover:text-red-900 transition-colors duration-200"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                  <button
                    disabled={currentProductPage === 1}
                    onClick={() => setCurrentProductPage(p => p - 1)}
                    className={`px-4 py-2 rounded transition-colors duration-200 ${currentProductPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentProductPage} of {totalProductPages}
                  </span>
                  <button
                    disabled={currentProductPage >= totalProductPages}
                    onClick={() => setCurrentProductPage(p => p + 1)}
                    className={`px-4 py-2 rounded transition-colors duration-200 ${currentProductPage >= totalProductPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white p-2 sm:p-6 rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 w-full">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Management ({orders.length})</h2>
            {orders.length === 0 && !loading ? (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-2 text-gray-500">No orders found</p>
              </div>
            ) : (
              <div className="w-full">
                {/* Mobile: Card layout */}
                <div className="block sm:hidden">
                  {orders.map((order) => (
                    <div key={order._id} className="bg-white rounded-lg shadow mb-2 p-3 flex flex-col gap-2 border border-blue-100 sm:hover:scale-105 sm:hover:shadow-2xl sm:transition-all sm:duration-300">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-blue-700" title={order._id}>#{order._id || 'N/A'}</span>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                            order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-gray-500 text-xs">Customer: {order.buyer?.name || order.buyer?.username || order.buyer?.email || order.buyer?.fullName || order.buyer?.userName || order.buyer?.user?.name || order.buyer?.user?.username || order.buyer?.user?.email || 'Unknown Customer'}</div>
                      <div className="text-gray-500 text-xs">Amount: ${order.totalAmount.toFixed(2)}</div>
                      <div className="text-gray-500 text-xs">Payment: {order.paymentMethod || order.paymentStatus || 'N/A'}</div>
                      <div className="text-gray-500 text-xs">Date: {new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-gray-500 text-xs">Products:
                        {Array.isArray(order.products) && order.products.length > 0 ? (
                          <ul className="list-disc pl-4">
                            {order.products.map((prod, idx) => (
                              <li key={idx}>{prod.title || prod.name || (prod.product && (prod.product.title || prod.product.name)) || 'Product'} × {prod.quantity || 1}</li>
                            ))}
                          </ul>
                        ) : Array.isArray(order.items) && order.items.length > 0 ? (
                          <ul className="list-disc pl-4">
                            {order.items.map((item, idx) => (
                              <li key={idx}>{item.title || item.name || (item.product && (item.product.title || item.product.name)) || 'Product'} × {item.quantity || 1}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400 ml-2">No products</span>
                        )}
                      </div>
                      <div>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                          disabled={order.status === 'Cancelled' || order.status === 'Delivered'}
                          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs mt-2 transition-colors duration-200
                            ${order.status === 'Delivered' ? 'bg-green-50' : 
                              order.status === 'Cancelled' ? 'bg-red-50' : 
                              'bg-yellow-50'} ${order.status === 'Cancelled' || order.status === 'Delivered' ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <option value="Processing" disabled={order.status !== 'Processing'}>Processing</option>
                          <option value="Shipped" disabled={order.status !== 'Processing' && order.status !== 'Shipped'}>Shipped</option>
                          <option value="Delivered" disabled={order.status !== 'Shipped'}>Delivered</option>
                          <option value="Cancelled" disabled={order.status === 'Delivered' || order.status === 'Cancelled'}>Cancelled</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop: Table layout */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden text-xs sm:text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-blue-50 transition-all duration-200 cursor-pointer">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 font-bold underline cursor-pointer" title={order._id}
                            onClick={() => { setSelectedOrder(order); setOrderDetailsModalOpen(true); }}>
                            #{order._id || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.buyer?.name || order.buyer?.username || order.buyer?.email || order.buyer?.fullName || order.buyer?.userName || order.buyer?.user?.name || order.buyer?.user?.username || order.buyer?.user?.email || 'Unknown Customer'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.totalAmount.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {Array.isArray(order.products) && order.products.length > 0 ? (
                              <ul className="list-disc pl-4 text-xs">
                                {order.products.map((prod, idx) => (
                                  <li key={idx}>{prod.title || prod.name || (prod.product && (prod.product.title || prod.product.name)) || 'Product'} × {prod.quantity || 1}</li>
                                ))}
                              </ul>
                            ) : Array.isArray(order.items) && order.items.length > 0 ? (
                              <ul className="list-disc pl-4 text-xs">
                                {order.items.map((item, idx) => (
                                  <li key={idx}>{item.title || item.name || (item.product && (item.product.title || item.product.name)) || 'Product'} × {item.quantity || 1}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-gray-400">No products</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${order.paymentStatus === 'Completed' ? 'bg-green-100 text-green-800' : 
                                'bg-yellow-100 text-yellow-800'}`}
                            >
                              {order.paymentMethod || order.paymentStatus || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                              disabled={order.status === 'Cancelled' || order.status === 'Delivered'}
                              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200
                                ${order.status === 'Delivered' ? 'bg-green-50' : 
                                  order.status === 'Cancelled' ? 'bg-red-50' : 
                                  'bg-yellow-50'} ${order.status === 'Cancelled' || order.status === 'Delivered' ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              <option value="Processing" disabled={order.status !== 'Processing'}>Processing</option>
                              <option value="Shipped" disabled={order.status !== 'Processing' && order.status !== 'Shipped'}>Shipped</option>
                              <option value="Delivered" disabled={order.status !== 'Shipped'}>Delivered</option>
                              <option value="Cancelled" disabled={order.status === 'Delivered' || order.status === 'Cancelled'}>Cancelled</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Order Details Modal (English) */}
            <Modal
              isOpen={orderDetailsModalOpen}
              onRequestClose={() => setOrderDetailsModalOpen(false)}
              contentLabel="Order Details"
              className="fixed inset-0 flex items-center justify-center z-50"
              overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
            >
              <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full relative">
                <button
                  onClick={() => setOrderDetailsModalOpen(false)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                >
                  &times;
                </button>
                <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                  Order Details
                </h2>
                {selectedOrder && (
                  <>
                    <div className="mb-2"><span className="font-semibold">Order ID:</span> {selectedOrder._id}</div>
                    <div className="mb-2"><span className="font-semibold">Customer:</span> {selectedOrder.buyer?.name || selectedOrder.buyer?.username || selectedOrder.buyer?.email || 'Unknown'}</div>
                    <div className="mb-2"><span className="font-semibold">Status:</span> {selectedOrder.status}</div>
                    <div className="mb-2"><span className="font-semibold">Created At:</span> {new Date(selectedOrder.createdAt).toLocaleDateString()}</div>
                    <div className="mb-2"><span className="font-semibold">Products:</span>
                      {Array.isArray(selectedOrder.products) && selectedOrder.products.length > 0 ? (
                        <ul className="list-disc pl-4">
                          {selectedOrder.products.map((prod, idx) => (
                            <li key={idx}>{prod.title || prod.name || 'Product'} × {prod.quantity || 1}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 ml-2">No products in this order</span>
                      )}
                    </div>
                    <div className="mb-2"><span className="font-semibold">Amount:</span> ${selectedOrder.totalAmount?.toFixed(2)}</div>
                    <div className="mb-2"><span className="font-semibold">Payment:</span> {selectedOrder.paymentMethod || selectedOrder.paymentStatus || 'N/A'}</div>
                  </>
                )}
              </div>
            </Modal>
          </div>
        )}
        </div>
  </div>
  );
}