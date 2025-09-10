import { Outlet, NavLink, Link } from "react-router-dom";
import { 
  FiHome, FiPlus, FiBox, FiClipboard, FiUser, FiMenu, 
  FiX, FiSettings, FiLogOut, FiBell, FiSearch, FiGlobe, 
  FiMail, FiPhone, FiShoppingCart, FiHeart, FiCheck, FiAlertCircle, FiPackage 
} from "react-icons/fi";
import { FaFacebook, FaTwitter, FaInstagram, FaPinterest, FaYoutube, FaMoon, FaSun } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { toggleDarkMode } from "../redux/themeSlice";
import Profile from "../pages/Profile";
import { motion } from "framer-motion";
import NotificationsPanel from "../components/NotificationsPanel";
import NotificationToastContainer from "../components/NotificationToast";
import ScrollToTop from "../components/ScrollToTop";
import { initializeNotifications, removeToastNotification, refreshNotifications, setHighlightedOrder } from "../redux/notificationSlice";
import NotificationHandler from "../components/NotificationHandler";
import '../styles/highlight.css';

export default function SellerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isDarkMode = useSelector(state => state.theme.darkMode);
  const user = useSelector(state => state.auth.user);
  const { unreadCount, toastNotifications, lastNotification } = useSelector(state => state.notifications);
  const dispatch = useDispatch();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user?._id) {
      const cleanup = dispatch(initializeNotifications(user._id));
      
      const refreshInterval = setInterval(() => {
        dispatch(refreshNotifications());
      }, 30000);
      
      return () => {
        if (cleanup) cleanup();
        clearInterval(refreshInterval);
      };
    }
  }, [dispatch, user]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const footerFeatures = [
    { icon: <FiBox className="text-xl" />, title: "Easy Management", desc: "Manage your products easily" },
    { icon: <FiClipboard className="text-xl" />, title: "Order Tracking", desc: "Track all your orders" },
    { icon: <FiGlobe className="text-xl" />, title: "Global Reach", desc: "Sell to customers worldwide" },
    { icon: <FiSettings className="text-xl" />, title: "Powerful Tools", desc: "Advanced seller tools" }
  ];

  const footerLinks = {
    "Seller Resources": [
      { name: "Seller Guide", path: "/seller-guide" },
      { name: "Pricing", path: "/pricing" },
      { name: "API Documentation", path: "/api-docs" },
      { name: "Terms & Conditions", path: "/terms" },
      { name: "Privacy Policy", path: "/privacy" }
    ],
    "Support": [
      { name: "Help Center", path: "/help" },
      { name: "Contact Support", path: "/support" },
      { name: "Shipping Guidelines", path: "/shipping" },
      { name: "FAQ", path: "/faq" },
      { name: "Community", path: "/community" }
    ],
    "Contact Info": [
      { icon: <FiPhone className="mr-2" />, text: "+1 234 567 8900" },
      { icon: <FiMail className="mr-2" />, text: "sellers@ourstore.com" },
      { icon: <FiGlobe className="mr-2" />, text: "Seller Portal" }
    ]
  };

  const socialLinks = [
    { icon: <FaFacebook />, url: "#", color: "hover:text-blue-400" },
    { icon: <FaTwitter />, url: "#", color: "hover:text-blue-300" },
    { icon: <FaInstagram />, url: "#", color: "hover:text-pink-400" },
    { icon: <FaPinterest />, url: "#", color: "hover:text-red-500" },
    { icon: <FaYoutube />, url: "#", color: "hover:text-red-400" }
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-blue-950 to-purple-950 text-gray-100' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-800'}`}>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className={`p-4 py-3 sticky top-0 z-50 backdrop-blur-lg transition-shadow duration-300 ${scrolled ? 'shadow-2xl' : 'shadow-lg'} ${
          isDarkMode 
            ? 'bg-gradient-to-r from-gray-900/95 via-blue-950/95 to-purple-950/95 border-b border-gray-700/30' 
            : 'bg-gradient-to-r from-blue-600/95 via-indigo-600/95 to-purple-600/95 border-b border-white/20'
        }`}
      >
        <div className="container mx-auto flex justify-between items-center">
          {/* Left: Brand + Mobile menu button */}
          <div className="flex items-center gap-4">


            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <Link to="/seller/dashboard" className="flex items-center gap-3 text-xl font-bold tracking-tight">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                  className={`p-2.5 rounded-xl ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 text-blue-200' 
                      : 'bg-gradient-to-br from-white/30 to-blue-400/30 text-white'
                  }`}
                >
                  <FiBox className="text-xl" />
                </motion.div>
                <span className={`hidden lg:inline font-extrabold bg-clip-text text-transparent ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-blue-300 to-purple-300'
                    : 'bg-gradient-to-r from-white to-blue-100'
                }`}>
                  Seller Panel
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Right: Nav links (desktop) + icons */}
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-2">
              <NavLink 
                to="/seller/dashboard" 
                className={({isActive}) => `px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive 
                    ? isDarkMode 
                      ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 shadow-lg ring-1 ring-blue-400/30' 
                      : 'bg-white text-blue-700 shadow-lg'
                    : isDarkMode 
                      ? 'text-blue-200 hover:bg-blue-700/20' 
                      : 'text-white hover:bg-white/20'
                }`}
              >
                <FiHome /> <span className="hidden lg:inline">Dashboard</span>
              </NavLink>
              <NavLink 
                to="/seller/add-product" 
                className={({isActive}) => `px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive 
                    ? isDarkMode 
                      ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 shadow-lg ring-1 ring-blue-400/30' 
                      : 'bg-white text-blue-700 shadow-lg'
                    : isDarkMode 
                      ? 'text-blue-200 hover:bg-blue-700/20' 
                      : 'text-white hover:bg-white/20'
                }`}
              >
                <FiPlus /> <span className="hidden lg:inline">Add Product</span>
              </NavLink>
              <NavLink 
                to="/seller/my-products" 
                className={({isActive}) => `px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive 
                    ? isDarkMode 
                      ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 shadow-lg ring-1 ring-blue-400/30' 
                      : 'bg-white text-blue-700 shadow-lg'
                    : isDarkMode 
                      ? 'text-blue-200 hover:bg-blue-700/20' 
                      : 'text-white hover:bg-white/20'
                }`}
              >
                <FiBox /> <span className="hidden lg:inline">Products</span>
              </NavLink>
              <NavLink 
                to="/seller/orders" 
                className={({isActive}) => `px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive 
                    ? isDarkMode 
                      ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 shadow-lg ring-1 ring-blue-400/30' 
                      : 'bg-white text-blue-700 shadow-lg'
                    : isDarkMode 
                      ? 'text-blue-200 hover:bg-blue-700/20' 
                      : 'text-white hover:bg-white/20'
                }`}
              >
                <FiClipboard /> <span className="hidden lg:inline">Orders</span>
              </NavLink>
            </nav>

            <motion.button
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch(toggleDarkMode())}
              className={`p-2.5 rounded-xl transform transition duration-150 ease-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkMode ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 ring-yellow-400/20' : 'bg-gray-800/20 text-gray-700 hover:bg-gray-800/30 ring-gray-200/20'}`}
              title="Toggle dark mode"
            >
              {isDarkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
            </motion.button>

            <button 
              onClick={() => {
                setNotificationsPanelOpen(prev => !prev);
              }} 
              className={`p-2.5 rounded-xl transition relative ${isDarkMode ? 'text-blue-200 hover:bg-blue-700/50' : 'text-white hover:bg-white/20'}`} 
              aria-label="Notifications"
            >
              <FiBell className="text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => { setProfileOpen(true); setSidebarOpen(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition ${
                  isDarkMode ? 'bg-blue-700/30 text-blue-200 hover:bg-blue-700/50' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <FiUser className="text-xl" />
                <span className="hidden md:inline-block text-sm">{user?.name || 'Account'}</span>
              </button>
            </div>
          </div>
        </div>


      </motion.header>

      {/* Profile Panel */}
      <Profile open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Toast Notifications */}
      <NotificationToastContainer
        notifications={toastNotifications}
        onClose={(id) => dispatch(removeToastNotification(id))}
      />

      {/* Notification Handler for Real-time Notifications */}
      <NotificationHandler
        notification={lastNotification}
        onNotificationClick={(notification) => {
          const { pathname, search } = notification.type === 'order'
            ? { pathname: '/seller/orders', search: `?highlight=${notification.relatedId}` }
            : { pathname: '/seller/my-products', search: `?highlight=${notification.relatedId}` };
          
          if (notification.relatedId) {
            dispatch(setHighlightedOrder(notification.relatedId));
          }
          
          navigate(pathname + search);
        }}
      />

      {/* Overlay for mobile/menu/profile */}
      {(sidebarOpen || profileOpen) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 backdrop-blur-sm transition-all duration-500"
          onClick={() => {
            setSidebarOpen(false);
            setProfileOpen(false);
          }}
        ></div>
      )}

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={notificationsPanelOpen}
        onClose={() => setNotificationsPanelOpen(false)}
      />

      {/* Main Content */}
      <main className={`flex-1 p-4 transition-colors duration-500 ${isDarkMode ? 'bg-gradient-to-br from-gray-900/70 to-blue-900/70' : 'bg-gradient-to-br from-blue-50/70 to-indigo-50/70'}`}>
        <div className="container mx-auto mt-4">
          <Outlet />
        </div>
      </main>

      {/* Footer (styled like buyer layout) */}
      <footer className={`mt-auto transition-colors duration-500 ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-800 text-white'}`}>
        {/* Features Section */}
        <div className={`py-8 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-700'}`}>
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {footerFeatures.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-gray-600/20 transition-colors duration-300"
                >
                  <div className={`p-3 rounded-full mb-3 ${isDarkMode ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-500/20 text-blue-400'}`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm opacity-80">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Column */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="lg:col-span-1"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-500/20 text-blue-400'}`}>
                  <FiBox className="text-2xl" />
                </div>
                <span className="text-xl font-bold">Seller Panel</span>
              </div>
              <p className="mb-4 opacity-80">
                Powerful tools to manage your online store. Track sales, manage inventory, and grow your business.
              </p>
              
              {/* Social Media */}
              <div>
                <h4 className="font-semibold mb-3">Follow Us</h4>
                <div className="flex gap-3">
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={index}
                      href={social.url || '#'}
                      whileHover={{ y: -3, scale: 1.1 }}
                      className={`p-2 rounded-full bg-gray-700 text-gray-300 transition-colors ${social.color}`}
                    >
                      {social.icon}
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Links Columns */}
            {Object.entries(footerLinks).map(([title, links], colIndex) => (
              <motion.div 
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: colIndex * 0.1 }}
                viewport={{ once: true }}
              >
                <h3 className="font-semibold text-lg mb-4 pb-2 border-b border-gray-600">{title}</h3>
                <ul className="space-y-2">
                  {links.map((link, index) => (
                    <motion.li 
                      key={index}
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      {link.path ? (
                        <a
                          href="#"
                          className="opacity-80 hover:opacity-100 hover:text-blue-300 transition-colors flex items-center"
                        >
                          {link.icon && <span className="mr-2">{link.icon}</span>}
                          {link.name || link.text}
                        </a>
                      ) : (
                        <div className="opacity-80 flex items-center">
                          {link.icon}
                          <span>{link.text}</span>
                        </div>
                      )}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-700'}`}>
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <span className="text-sm opacity-80">
                  © {new Date().getFullYear()} Our Store. All rights reserved.
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm opacity-80">
                <span>Seller Portal</span>
                <span>•</span>
                <span>v2.1.0</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ScrollToTop Button */}
      <ScrollToTop />
    </div>
  );
}