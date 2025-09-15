import React, { useEffect, useState, useMemo, useRef } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import Modal from 'react-modal';

import Profile from "../pages/Profile";
import ScrollToTop from "./ScrollToTop";
import NotificationHandler from "./NotificationHandler";
import NotificationsPanel from "./NotificationsPanel";
import NotificationToastContainer from "./NotificationToast";

import { toggleDarkMode } from "../redux/themeSlice";
import { fetchWishlistCount } from "../redux/wishlist.slice";
import { fetchCart } from "../redux/cart.slice";
import { initializeNotifications, removeToastNotification, refreshNotifications } from "../redux/notificationSlice";

import { FaStore, FaHeart, FaShoppingCart, FaUserCircle, FaClipboardList, FaTruck, FaCreditCard, FaShieldAlt, FaHeadset, FaFacebook, FaTwitter, FaInstagram, FaPinterest, FaYoutube, FaPhone, FaEnvelope, FaMapMarkerAlt, FaMoon, FaSun, FaBars, FaTimes } from "react-icons/fa";
import { FiBox, FiClipboard, FiPlus, FiHome, FiBell, FiUser, FiPhone as FiPhone2, FiMail, FiGlobe, FiSettings } from "react-icons/fi";

Modal.setAppElement('#root');

export default function MainLayout({ role = "buyer" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isDarkMode = useSelector(s => s.theme.darkMode);
  const { user, token } = useSelector(s => s.auth);
  const { count } = useSelector(s => s.wishlist);
  const { items } = useSelector(s => s.cart);
  const notificationsState = useSelector(s => s.notifications);

  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [cartBadgeAnim, setCartBadgeAnim] = useState(false);
  const [wishlistBadgeAnim, setWishlistBadgeAnim] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [sidebarVisible, setSidebarVisible] = useState(true);


  const isBuyer = role === "buyer";

  useEffect(() => {
    setCartBadgeAnim(true);
    const t = setTimeout(() => setCartBadgeAnim(false), 400);
    return () => clearTimeout(t);
  }, [items.length]);

  useEffect(() => {
    setWishlistBadgeAnim(true);
    const t = setTimeout(() => setWishlistBadgeAnim(false), 400);
    return () => clearTimeout(t);
  }, [count]);


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && token) {
      dispatch(fetchWishlistCount());
      dispatch(fetchCart());
    }
  }, [user, token, dispatch]);

  useEffect(() => {
    if (user?._id) {
      dispatch(initializeNotifications(user._id));
      const interval = setInterval(() => dispatch(refreshNotifications()), 30000);
      return () => clearInterval(interval);
    }
  }, [user, dispatch, role]);


  const lastMobileToggleAt = useRef(0);
  const closeMobileMenu = (force = false) => {
    if (!force && Date.now() - lastMobileToggleAt.current < 600) return;
    setMobileMenuOpen(false);
    lastMobileToggleAt.current = Date.now();
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  };
  useEffect(() => {

    const breakpoint = 1024;
    const applyBodyStyles = (open) => {
      if (open) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      } else {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
    };

    applyBodyStyles(mobileMenuOpen);

    const handleResize = () => {
      if (Date.now() - lastMobileToggleAt.current < 600) return;

      if (window.innerWidth > breakpoint && mobileMenuOpen) {
        setMobileMenuOpen(false);
        applyBodyStyles(false);
      }
    };

    window.addEventListener('resize', handleResize);
    const noopScroll = () => setSidebarVisible(true);
    window.addEventListener('scroll', noopScroll, { passive: true });

    return () => {
      applyBodyStyles(false);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', noopScroll);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  

  const footerFeatures = useMemo(() => (
    isBuyer ? [
      { icon: <FaTruck className="text-xl" />, title: "Free Shipping", desc: "On orders over $50" },
      { icon: <FaCreditCard className="text-xl" />, title: "Secure Payment", desc: "100% secure payment" },
      { icon: <FaShieldAlt className="text-xl" />, title: "Safe Shopping", desc: "Buy with confidence" },
      { icon: <FaHeadset className="text-xl" />, title: "24/7 Support", desc: "Dedicated support" }
    ] : [
      { icon: <FiBox className="text-xl" />, title: "Easy Management", desc: "Manage your products easily" },
      { icon: <FiClipboard className="text-xl" />, title: "Order Tracking", desc: "Track all your orders" },
      { icon: <FiGlobe className="text-xl" />, title: "Global Reach", desc: "Sell worldwide" },
      { icon: <FiSettings className="text-xl" />, title: "Powerful Tools", desc: "Advanced seller tools" }
    ]
  ), [isBuyer]);

  const footerLinks = useMemo(() => {
    const buyer = {
      Company: [{ name: "About Us", path: "/about" }, { name: "Careers", path: "/careers" }, { name: "Stores", path: "/stores" }, { name: "Terms", path: "/terms" }, { name: "Privacy", path: "/privacy" }],
      "Customer Care": [{ name: "Track Order", path: "/track-order" }, { name: "Returns", path: "/returns" }, { name: "Shipping", path: "/shipping" }, { name: "FAQ", path: "/faq" }, { name: "Contact", path: "/contact" }],
      "Contact Info": [{ icon: <FaMapMarkerAlt className="mr-2" />, text: "123 Commerce St" }, { icon: <FaPhone className="mr-2" />, text: "+1 234 567 8900" }, { icon: <FaEnvelope className="mr-2" />, text: "support@ourstore.com" }]
    };
    const seller = {
      "Seller Resources": [{ name: "Seller Guide", path: "/seller-guide" }, { name: "Pricing", path: "/pricing" }, { name: "API Docs", path: "/api-docs" }, { name: "Terms", path: "/terms" }, { name: "Privacy", path: "/privacy" }],
      Support: [{ name: "Help Center", path: "/help" }, { name: "Contact Support", path: "/support" }, { name: "Shipping Guidelines", path: "/shipping" }, { name: "FAQ", path: "/faq" }, { name: "Community", path: "/community" }],
      "Contact Info": [{ icon: <FiPhone2 className="mr-2" />, text: "+1 234 567 8900" }, { icon: <FiMail className="mr-2" />, text: "sellers@ourstore.com" }, { icon: <FiGlobe className="mr-2" />, text: "Seller Portal" }]
    };
    return isBuyer ? buyer : seller;
  }, [isBuyer]);

  const socialLinks = [
    { name: 'Facebook', icon: <FaFacebook />, url: "#", color: "hover:text-blue-400" },
    { name: 'Twitter', icon: <FaTwitter />, url: "#", color: "hover:text-blue-300" },
    { name: 'Instagram', icon: <FaInstagram />, url: "#", color: "hover:text-pink-400" },
    { name: 'Pinterest', icon: <FaPinterest />, url: "#", color: "hover:text-red-500" },
    { name: 'YouTube', icon: <FaYoutube />, url: "#", color: "hover:text-red-400" }
  ];

  const IconLink = ({ to, children, title, badge, label, isCollapsed = false }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `relative p-2 sm:p-2.5 rounded-xl flex items-center justify-center transform transition-all duration-300 ease-out active:scale-95 group ${
          isActive 
            ? (isDarkMode 
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg' 
                : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg') 
            : (isDarkMode 
                ? 'text-blue-200 hover:bg-blue-700/30 hover:shadow-md' 
                : 'text-white hover:bg-white/30 hover:shadow-md')
        }`
      } 
      title={title} 
      aria-label={title}
    >
      <div className="flex items-center gap-1 sm:gap-2">
        <span className="text-[18px] sm:text-[20px] transition-transform duration-300 group-hover:scale-110">{children}</span>
        {!isCollapsed && label && <span className="hidden lg:inline-block text-sm font-medium ml-1">{label}</span>}
      </div>
      {badge && (
        <motion.span
          initial={false}
          animate={badge ? { scale: [1, 1.15, 1], opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={badge ? { type: 'tween', duration: 0.45, times: [0, 0.5, 1], ease: 'easeOut' } : { type: 'spring', stiffness: 600, damping: 20 }}
          className={`absolute -top-1 -right-1 text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg ${
            isDarkMode
              ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
              : 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
          }`}
          aria-hidden={badge ? 'false' : 'true'}
        >
          {badge ? (badge > 99 ? '99+' : badge) : null}
        </motion.span>
      )}
    </NavLink>
  );

  const NavButton = ({ to, children, title, label, isCollapsed = false }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 group ${
          isActive
            ? (isDarkMode
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg')
            : (isDarkMode
                ? 'text-blue-200 hover:bg-blue-700/30 hover:shadow-md'
                : 'text-white hover:bg-white/30 hover:shadow-md')
        }`
      }
    >
      <span className="transition-transform duration-300 group-hover:scale-110">{children}</span>
      {!isCollapsed && label && <span className="hidden lg:inline">{label}</span>}
    </NavLink>
  );

  const renderNavItems = () => {
    if (!user) {
      return (
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            className={`px-4 py-2 rounded-md font-semibold transform transition duration-150 shadow-sm focus:outline-none focus:ring-2 ${
              isDarkMode
                ? 'bg-white/10 text-white hover:bg-white/20 ring-white/10'
                : 'bg-white/20 text-white hover:bg-white/30 ring-blue-200'
            }`}
          >
            <Link to="/register">Register</Link>
          </motion.div>
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            className={`px-4 py-2 rounded-md font-semibold border transform transition duration-150 focus:outline-none focus:ring-2 ${
              isDarkMode
                ? 'border-white/20 text-white hover:bg-white/10 ring-white/10'
                : 'border-white/30 text-white hover:bg-white/20 ring-blue-200'
            }`}
          >
            <Link to="/login">Login</Link>
          </motion.div>
        </div>
      );
    }

    if (isBuyer) {
      return (
        <>
          <IconLink to="/buyer/orders" title="Orders" label="Orders" badge={null}>
            <FaClipboardList size={18} />
          </IconLink>
          <IconLink to="/cart" title="Cart" label="Cart" badge={items.length > 0 ? items.length : null}>
            <FaShoppingCart size={18} />
          </IconLink>
          <IconLink to="/wishlist" title="Wishlist" label="Wishlist" badge={count > 0 ? count : null}>
            <FaHeart size={18} />
          </IconLink>
        </>
      );
    }

    return (
      <>
        {[
          { to: "/seller/dashboard", icon: <FiHome size={18} />, label: "Dashboard" },
          { to: "/seller/add-product", icon: <FiPlus size={18} />, label: "Add Product" },
          { to: "/seller/my-products", icon: <FiBox size={18} />, label: "Products" },
          { to: "/seller/orders", icon: <FiClipboard size={18} />, label: "Orders" }
        ].map((it) => (
          <NavButton key={it.to} to={it.to} label={it.label}>
            {it.icon}
          </NavButton>
        ))}
      </>
    );
  };

  const MobileMenu = () => (
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm lg:hidden"
            onClick={() => closeMobileMenu()}
          ></motion.div>
          
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 left-0 h-full z-50 shadow-2xl lg:hidden ${
              isDarkMode 
                ? 'bg-gradient-to-b from-gray-900 to-blue-950' 
                : 'bg-gradient-to-b from-blue-600 to-indigo-700'
            }`}
            style={{ width: 'min(80%, 320px)' }}
          >
            <div className="p-5 flex flex-col h-full">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-700/30 text-blue-200' : 'bg-white/20 text-white'}`}>
                    {isBuyer ? <FaStore size={24} /> : <FiBox size={24} />}
                  </div>
                  <span className="text-xl font-bold text-white">
                    {isBuyer ? 'Our Store' : 'Seller Panel'}
                  </span>
                </div>
                <button 
                  onClick={() => closeMobileMenu(true)}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-blue-800/50' : 'hover:bg-white/20'} text-white`}
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-4">
                {isBuyer && (
                    <NavLink 
                      to="/store" 
                      className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl text-white ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`}
                      onClick={() => closeMobileMenu()}
                    >
                    <FiHome size={20} />
                    <span>Home</span>
                  </NavLink>
                )}
                
                {user ? (
                  <>
                    {isBuyer ? (
                      <>
                        <NavLink 
                          to="/buyer/orders" 
                          className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl text-white ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`}
                          onClick={() => closeMobileMenu()}
                        >
                          <FaClipboardList size={20} />
                          <span>Orders</span>
                        </NavLink>
                        <NavLink 
                          to="/cart" 
                          className={({ isActive }) => `flex items-center justify-between gap-3 p-3 rounded-xl text-white ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`}
                          onClick={() => closeMobileMenu()}
                        >
                          <div className="flex items-center gap-3">
                            <FaShoppingCart size={20} />
                            <span>Cart</span>
                          </div>
                          <motion.span
                            initial={false}
                            animate={items.length > 0 ? { scale: [1, 1.15, 1], opacity: 1 } : { scale: 0, opacity: 0 }}
                            transition={items.length > 0 ? { type: 'tween', duration: 0.45, times: [0, 0.5, 1], ease: 'easeOut' } : { type: 'spring', stiffness: 600, damping: 20 }}
                            className="ml-2 inline-flex items-center justify-center bg-red-500 text-white text-xs rounded-full h-5 min-w-[1.25rem] px-1.5 font-bold"
                            aria-hidden={items.length > 0 ? 'false' : 'true'}
                          >
                            {items.length > 0 ? (items.length > 99 ? '99+' : items.length) : null}
                          </motion.span>
                        </NavLink>
                        <NavLink 
                          to="/wishlist" 
                          className={({ isActive }) => `flex items-center justify-between gap-3 p-3 rounded-xl text-white ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`}
                          onClick={() => closeMobileMenu()}
                        >
                          <div className="flex items-center gap-3">
                            <FaHeart size={20} />
                            <span>Wishlist</span>
                          </div>
                          <motion.span
                            initial={false}
                            animate={count > 0 ? { scale: [1, 1.15, 1], opacity: 1 } : { scale: 0, opacity: 0 }}
                            transition={count > 0 ? { type: 'tween', duration: 0.45, times: [0, 0.5, 1], ease: 'easeOut' } : { type: 'spring', stiffness: 600, damping: 20 }}
                            className="ml-2 inline-flex items-center justify-center bg-red-500 text-white text-xs rounded-full h-5 min-w-[1.25rem] px-1.5 font-bold"
                            aria-hidden={count > 0 ? 'false' : 'true'}
                          >
                            {count > 0 ? (count > 99 ? '99+' : count) : null}
                          </motion.span>
                        </NavLink>
                      </>
                    ) : (
                      <>
                        <NavLink 
                          to="/seller/dashboard" 
                          className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl text-white ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`}
                          onClick={() => closeMobileMenu()}
                        >
                          <FiHome size={20} />
                          <span>Dashboard</span>
                        </NavLink>
                        <NavLink 
                          to="/seller/add-product" 
                          className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl text-white ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`}
                          onClick={() => closeMobileMenu()}
                        >
                          <FiPlus size={20} />
                          <span>Add Product</span>
                        </NavLink>
                        <NavLink 
                          to="/seller/my-products" 
                          className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl text-white ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`}
                          onClick={() => closeMobileMenu()}
                        >
                          <FiBox size={20} />
                          <span>Products</span>
                        </NavLink>
                        <NavLink 
                          to="/seller/orders" 
                          className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl text-white ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`}
                          onClick={() => closeMobileMenu()}
                        >
                          <FiClipboard size={20} />
                          <span>Orders</span>
                        </NavLink>
                      </>
                    )}
                  </>
                ) : (
                  <div className="space-y-3 pt-4">
                    <Link 
                      to="/register" 
                      className="block w-full text-center py-3 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
                      onClick={() => closeMobileMenu()}
                    >
                      Register
                    </Link>
                    <Link 
                      to="/login" 
                      className="block w-full text-center py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-colors"
                      onClick={() => closeMobileMenu()}
                    >
                      Login
                    </Link>
                  </div>
                )}
              </nav>

              <div className="pt-6 border-t border-white/20">
                <button 
                  onClick={() => { dispatch(toggleDarkMode()); closeMobileMenu(); }}
                  className="flex items-center gap-3 p-3 rounded-xl text-white hover:bg-white/10 w-full"
                >
                  {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                
                <button 
                  onClick={() => {
                    setNotificationsPanelOpen(true);
                    closeMobileMenu(true);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl text-white hover:bg-white/10 w-full"
                >
                  <div className="relative">
                    <FiBell size={20} />
                    {notificationsState.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {notificationsState.unreadCount}
                      </span>
                    )}
                  </div>
                  <span>Notifications</span>
                </button>
                
                <button 
                  onClick={() => {
                    setProfileOpen(true);
                    closeMobileMenu(true);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl text-white hover:bg-white/10 w-full"
                >
                  <FaUserCircle size={20} />
                  <span>Profile</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 overflow-x-hidden ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-blue-950 to-purple-950 text-gray-100' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-800'}`}>
      <motion.header 
        initial={false}
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.5, type: "spring" }} 
        className={`px-2 sm:px-4 py-2 sm:py-3 fixed top-0 left-0 w-full z-50 backdrop-blur-lg transition-all duration-300 ${
          scrolled ? "shadow-2xl" : "shadow-md"
        } ${
          isDarkMode 
            ? "bg-gradient-to-r from-gray-900/95 via-blue-950/95 to-purple-950/95 border-b border-gray-700/30" 
            : "bg-gradient-to-r from-blue-600/95 via-indigo-600/95 to-purple-600/95 border-b border-white/20"
        }`}
      >
        <div className="container mx-auto relative flex justify-between items-center gap-4 px-4">
          <div className="flex items-center gap-2">
            {user && (
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                className="lg:hidden text-white p-1.5 rounded-lg"
                onClick={() => {
                  setMobileMenuOpen(true);
                  lastMobileToggleAt.current = Date.now();
                }}
                aria-label="Open menu"
              >
                <FaBars size={20} />
              </motion.button>
            )}
            
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              className="flex items-center gap-2"
            >
              <Link 
                to={isBuyer ? "/store" : "/seller/dashboard"} 
                className="flex items-center gap-1 sm:gap-2 text-xl sm:text-2xl font-bold tracking-tight"
              >
                <motion.div 
                  animate={{ rotate: [0, 5, -5, 0] }} 
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }} 
                  className={`p-1.5 sm:p-2 rounded-xl ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 text-blue-200' 
                      : 'bg-gradient-to-br from-blue-500/30 to-purple-500/30 text-white'
                  }`}
                >
                  {isBuyer ? <FaStore className="text-xl sm:text-2xl" /> : <FiBox className="text-lg sm:text-xl" />}
                </motion.div>
                <span className={`hidden md:inline font-extrabold bg-clip-text text-transparent ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-blue-300 to-purple-300' 
                    : 'bg-gradient-to-r from-white to-blue-100'
                }`}>
                  {isBuyer ? 'Our Store' : 'Seller Panel'}
                </span>
              </Link>
            </motion.div>
            </div>

            {!user && (
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 lg:hidden flex items-center gap-3">
                <Link to="/register" className="text-sm font-semibold text-white px-3 py-1 rounded-md bg-white/10 hover:bg-white/20">Register</Link>
                <Link to="/login" className="text-sm font-semibold text-white px-3 py-1 rounded-md border border-white/20 hover:bg-white/10">Login</Link>
              </div>
            )}

          <nav className="flex-1 hidden lg:flex justify-center gap-2 sm:gap-3 items-center">
            {user && isBuyer && (
              <IconLink to="/store" title="Home" label="Home">
                <FiHome size={18} />
              </IconLink>
            )}
            {renderNavItems()}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
              <motion.button 
                whileHover={{ scale: 1.07, y: -2 }} 
                whileTap={{ scale: 0.95 }} 
                onClick={() => dispatch(toggleDarkMode())} 
                className={` sm:flex p-1.5 sm:p-2.5 rounded-xl transform transition duration-150 ease-out active:scale-95 focus:outline-none ${
                  isDarkMode 
                    ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' 
                    : 'bg-gray-800/20 text-gray-700 hover:bg-gray-800/30'
                }`} 
                title="Toggle dark mode" 
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
              </motion.button>

              {user && (
                <>
                  <motion.button 
                    whileHover={{ scale: 1.03, y: -2 }} 
                    whileTap={{ scale: 0.95 }} 
                    onClick={() => setNotificationsPanelOpen(prev => !prev)} 
                    className={` sm:flex p-1.5 sm:p-2.5 rounded-xl transition relative items-center gap-1 sm:gap-2 ${
                      isDarkMode 
                        ? 'text-blue-200 hover:bg-blue-700/30' 
                        : 'text-white hover:bg-white/20'
                    }`} 
                    title="Notifications" 
                    aria-label="Notifications"
                  >
                    <FiBell className="text-lg sm:text-xl" />
                    {notificationsState.unreadCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-4 h-4 text-xs flex items-center justify-center bg-red-500 text-white rounded-full"
                      >
                        {notificationsState.unreadCount > 9 ? '9+' : notificationsState.unreadCount}
                      </motion.span>
                    )}
                  </motion.button>

                  <motion.button 
                    whileHover={{ y: -2 }} 
                    whileTap={{ y: 0 }} 
                    onClick={() => setProfileOpen(true)} 
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-blue-700/30 to-purple-700/30 text-blue-200 hover:from-blue-700/40 hover:to-purple-700/40' 
                        : 'bg-gradient-to-r from-white/20 to-blue-100/20 text-white hover:from-white/30 hover:to-blue-100/30'
                    }`} 
                    title="Open profile" 
                    aria-label="Open profile"
                  >
                    <FaUserCircle size={18} />
                    <span className="hidden md:inline-block text-xs sm:text-sm">{user?.name || 'Account'}</span>
                  </motion.button>
                </>
              )}


          </div>
        </div>
      </motion.header>

      <MobileMenu />

      {(sidebarOpen || profileOpen) && <div className="fixed inset-0 bg-black bg-opacity-30 z-40 backdrop-blur-sm transition-all duration-500" onClick={() => { setSidebarOpen(false); setProfileOpen(false); }}></div>}

      {(role === "seller" || role === "buyer") && (
        <>
          <NotificationToastContainer notifications={notificationsState.toastNotifications} onClose={(id) => dispatch(removeToastNotification(id))} />
          <NotificationHandler notification={notificationsState.lastNotification} />
          <NotificationsPanel isOpen={notificationsPanelOpen} onClose={() => setNotificationsPanelOpen(false)} />
        </>
      )}

      <Profile open={profileOpen} onClose={() => setProfileOpen(false)} />

      <main 
        className={`flex-1 p-4 transition-colors duration-500 ${isDarkMode ? 'bg-gradient-to-br from-gray-900/70 to-blue-900/70' : 'bg-gradient-to-br from-blue-50/70 to-indigo-50/70'}`} 
        style={{ paddingTop: '4rem' }}
      >
        <div className="container mx-auto px-4">
          <ScrollToTop />
          <Outlet />
        </div>
      </main>

      <footer className={`mt-auto w-full transition-colors duration-500 ${isDarkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200' : 'bg-gradient-to-b from-gray-800 to-gray-900 text-white'}`}>
        <div className={`py-4 sm:py-6 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-700/50'}`}>
          <div className="container mx-auto px-3 sm:px-4 overflow-hidden">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-6">
              {footerFeatures.map((f, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.5, delay: i * 0.08 }} 
                  viewport={{ once: true }} 
                  className="flex flex-col items-center text-center p-2 rounded-lg hover:bg-gray-600/20 transition-colors"
                >
                  <div className={`p-2 rounded-full mb-2 ${isDarkMode ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-500/20 text-blue-400'}`}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-xs opacity-80">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
<div className="hidden sm:block container mx-auto px-2 py-6">
  <div className="flex flex-wrap justify-center gap-60">
    {Object.entries(footerLinks).map(([title, links], idx) => (
      <motion.div 
        key={title} 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: idx * 0.05 }} 
        viewport={{ once: true }}
        className="w-[200px] text-left"
      >
        <h3 className="font-semibold text-lg mb-4 pb-2 border-b border-gray-600">
          {title}
        </h3>
        <ul className="space-y-2">
          {links.map((lnk, i) => (
            <motion.li 
              key={i} 
              whileHover={{ x: 5 }} 
              transition={{ duration: 0.18 }}
            >
              <a 
                href={lnk.url} 
                className="opacity-80 flex items-center hover:opacity-100 transition-opacity"
              >
                {lnk.icon && <span className="mr-2">{lnk.icon}</span>}
                {lnk.name || lnk.text}
              </a>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    ))}
  </div>
</div>





        <div className="container mx-auto px-3 py-6 text-center">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-500/20 text-blue-400'}`}>
                {isBuyer ? <FaStore className="text-2xl" /> : <FiBox className="text-2xl" />}
              </div>
              <span className="text-lg font-bold">{isBuyer ? 'Our Store' : 'Seller Panel'}</span>
            </div>
            <p className="text-sm opacity-80">
              {isBuyer ? 'Your one-stop shop for quality products.' : 'Powerful tools to manage your online store.'}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((s, idx) => (
                <motion.a 
                  key={idx} 
                  href="#" 
                  whileHover={{ y: -3, scale: 1.1 }} 
                  className={`p-2 rounded-full bg-gray-700 text-gray-300 ${s.color}`} 
                  title={s.name}
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>
          </div>
          <div className="mt-4 text-xs opacity-80">
            © {new Date().getFullYear()} Our Store. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}