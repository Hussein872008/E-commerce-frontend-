import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleDarkMode } from "../redux/themeSlice";
import { Outlet, NavLink, Link } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import Profile from "../pages/Profile";
import { fetchWishlistCount } from "../redux/wishlist.slice";
import { fetchCart } from "../redux/cart.slice";
import { motion } from "framer-motion";
import { 
  FaHeart, FaShoppingCart, FaUserCircle, FaClipboardList, 
  FaStore, FaMoon, FaSun, FaFacebook, FaTwitter, FaInstagram, 
  FaPinterest, FaYoutube, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaCreditCard, FaShieldAlt, FaTruck, FaHeadset 
} from "react-icons/fa";

export default function BuyerLayout() {
  const { count } = useSelector(state => state.wishlist);
  const { items } = useSelector(state => state.cart);
  const [cartBadgeAnim, setCartBadgeAnim] = React.useState(false);
  const [wishlistBadgeAnim, setWishlistBadgeAnim] = React.useState(false);
  const isDarkMode = useSelector(state => state.theme.darkMode);
  const [scrolled, setScrolled] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    setCartBadgeAnim(true);
    const timer = setTimeout(() => setCartBadgeAnim(false), 400);
    return () => clearTimeout(timer);
  }, [items.length]);

  React.useEffect(() => {
    setWishlistBadgeAnim(true);
    const timer = setTimeout(() => setWishlistBadgeAnim(false), 400);
    return () => clearTimeout(timer);
  }, [count]);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const { user, token } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [profileOpen, setProfileOpen] = React.useState(false);

  useEffect(() => {
    if (user && token) {
      dispatch(fetchWishlistCount());
      dispatch(fetchCart());
    }
  }, [user, token, dispatch]);

  const isBuyer = user && (user.role === "buyer" || user.role === "admin");

  const footerFeatures = [
    { icon: <FaTruck className="text-xl" />, title: "Free Shipping", desc: "On orders over $50" },
    { icon: <FaCreditCard className="text-xl" />, title: "Secure Payment", desc: "100% secure payment" },
    { icon: <FaShieldAlt className="text-xl" />, title: "Safe Shopping", desc: "Buy with confidence" },
    { icon: <FaHeadset className="text-xl" />, title: "24/7 Support", desc: "Dedicated support" }
  ];

  const footerLinks = {
    "Company": [
      { name: "About Us", path: "/about" },
      { name: "Careers", path: "/careers" },
      { name: "Our Stores", path: "/stores" },
      { name: "Terms & Conditions", path: "/terms" },
      { name: "Privacy Policy", path: "/privacy" }
    ],
    "Customer Care": [
      { name: "Track Your Order", path: "/track-order" },
      { name: "Returns & Exchanges", path: "/returns" },
      { name: "Shipping & Delivery", path: "/shipping" },
      { name: "FAQ", path: "/faq" },
      { name: "Contact Us", path: "/contact" }
    ],
    "Contact Info": [
      { icon: <FaMapMarkerAlt className="mr-2" />, text: "123 Commerce St, City, Country" },
      { icon: <FaPhone className="mr-2" />, text: "+1 234 567 8900" },
      { icon: <FaEnvelope className="mr-2" />, text: "support@ourstore.com" }
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
            {/* Logo */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3"
            >
              <Link to="/store" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                  className={`p-2 rounded-xl ${isDarkMode ? 'bg-blue-700/30 text-blue-200' : 'bg-white/20 text-white'}`}
                >
                  <FaStore className="text-2xl" />
                </motion.div>
                <span
  className={`hidden md:inline font-extrabold bg-clip-text text-transparent ${
    isDarkMode
      ? 'bg-gradient-to-r from-blue-300 to-purple-300'
      : 'bg-gradient-to-r from-white to-blue-100'
  }`}
>
  Our Store
</span>

              </Link>
            </motion.div>

            {/* Icons Navbar */}
            <nav className="flex gap-3 items-center">
              {/* Dark mode toggle */}
              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => dispatch(toggleDarkMode())}
                className={`p-2.5 rounded-xl transform transition duration-150 ease-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkMode ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 ring-yellow-400/20' : 'bg-gray-800/20 text-gray-700 hover:bg-gray-800/30 ring-gray-200/20'}`}
                title="Toggle dark mode"
              >
                {isDarkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
              </motion.button>

              {user ? (
                <>
                  {/* Orders */}
                  <NavLink to="/buyer/orders" className={({ isActive }) => `relative p-2.5 rounded-xl flex items-center justify-center transform transition duration-150 ease-out active:scale-95 hover:scale-105 group ${isActive ? (isDarkMode ? 'bg-blue-500/30 text-blue-300 shadow-lg scale-110' : 'bg-white text-blue-700 shadow-lg scale-110') : (isDarkMode ? 'text-blue-200 hover:bg-blue-700/50' : 'text-white hover:bg-white/20')}`}>
                    <FaClipboardList size={20} />
                  </NavLink>

                  {/* Cart */}
                  <NavLink to="/cart" className={({ isActive }) => `relative p-2.5 rounded-xl flex items-center justify-center transform transition duration-150 ease-out active:scale-95 hover:scale-105 group ${isActive ? (isDarkMode ? 'bg-blue-500/30 text-blue-300 shadow-lg scale-110' : 'bg-white text-blue-700 shadow-lg scale-110') : (isDarkMode ? 'text-blue-200 hover:bg-blue-700/50' : 'text-white hover:bg-white/20')}`}>
                    <FaShoppingCart size={20} />
                    {items.length > 0 && (
                      <motion.span initial={{ scale: 0.7, opacity: 0.7 }} animate={cartBadgeAnim ? { scale: 1.2, opacity: 1 } : { scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} className={`absolute -top-2 -right-2 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg border-2 ${isDarkMode ? 'border-gray-800 bg-gradient-to-r from-blue-500 to-indigo-600' : 'border-white bg-gradient-to-r from-blue-500 to-indigo-600'}`}>{items.length > 99 ? '99+' : items.length}</motion.span>
                    )}
                  </NavLink>

                  {/* Wishlist */}
                  <NavLink to="/wishlist" className={({ isActive }) => `relative p-2.5 rounded-xl flex items-center justify-center transform transition duration-150 ease-out active:scale-95 hover:scale-105 group ${isActive ? (isDarkMode ? 'bg-rose-500/30 text-rose-300 shadow-lg scale-110' : 'bg-white text-rose-600 shadow-lg scale-110') : (isDarkMode ? 'text-rose-200 hover:bg-rose-700/50' : 'text-white hover:bg-white/20')}`}>
                    <FaHeart size={20} />
                    {count > 0 && (
                      <motion.span initial={{ scale: 0.7, opacity: 0.7 }} animate={wishlistBadgeAnim ? { scale: 1.2, opacity: 1 } : { scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} className={`absolute -top-2 -right-2 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg border-2 ${isDarkMode ? 'text-white border-gray-800 bg-gradient-to-r from-rose-500 to-pink-600' : 'text-white border-white bg-gradient-to-r from-rose-500 to-pink-600'}`} style={{ pointerEvents: 'none' }}>{count > 99 ? '99+' : count}</motion.span>
                    )}
                  </NavLink>

                  {/* Profile (opens sidebar) */}
                  <button onClick={() => setProfileOpen(true)} className={`relative p-2.5 rounded-xl flex items-center justify-center transform transition duration-150 ease-out active:scale-95 hover:scale-105 group ${isDarkMode ? 'text-blue-200 hover:bg-blue-700/50' : 'text-white hover:bg-white/20'}`} title="Open profile">
                    <FaUserCircle size={20} />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/register" className={`px-4 py-2 rounded-md font-semibold transform transition duration-150 hover:scale-105 active:scale-95 shadow-sm focus:outline-none focus:ring-2 ${isDarkMode ? 'bg-white/5 text-white hover:bg-white/10 ring-white/10' : 'bg-white text-blue-700 hover:bg-blue-50 ring-blue-200'}`}>Register</Link>
                  <Link to="/login" className={`px-4 py-2 rounded-md font-semibold border transform transition duration-150 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 ${isDarkMode ? 'border-white/10 text-white hover:bg-white/5 ring-white/10' : 'border-white/20 text-white hover:bg-white/10 ring-blue-200'}`}>Login</Link>
                </div>
              )}
            </nav>
          </div>
  </motion.header>

      {/* MAIN */}
      <main className={`flex-1 p-4 transition-colors duration-500 ${isDarkMode ? 'bg-gradient-to-br from-gray-900/70 to-blue-900/70' : 'bg-gradient-to-br from-blue-50/70 to-indigo-50/70'}`}>
        <div className="container mx-auto">
          <ScrollToTop />
          <Outlet />
        </div>
      </main>

      {/* FOOTER */}
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
                    <FaStore className="text-2xl" />
                  </div>
                  <span aria-hidden="true" className="text-xl font-bold hidden md:inline-block">Our Store</span>
                </div>
                <p className="mb-4 opacity-80">
                  Your one-stop shop for quality products. We offer the best prices and customer service.
                </p>
                
                {/* Newsletter Subscription */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Subscribe to Newsletter</h4>
                  <div className="flex">
                    <input 
                      type="email" 
                      placeholder="Your email" 
                      className="flex-1 px-3 py-2 rounded-l-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className={`px-4 py-2 rounded-r-lg font-semibold transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}>
                      Subscribe
                    </button>
                  </div>
                </div>

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
          <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-700'} bg-transparent`}> 
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <span className="text-sm opacity-80">
                    © {new Date().getFullYear()} Our Store. All rights reserved.
                  </span>
                  <div className="hidden md:flex items-center gap-4 text-sm opacity-80">
                    <span>•</span>
                    <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>{currentTime.toLocaleDateString()}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Back to Top Button */}
          {scrolled && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`fixed bottom-6 right-6 p-3 rounded-full shadow-lg z-40 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </motion.button>
          )}
        </footer>
  {/* Profile sidebar instance (renders above the page) */}
  <Profile open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}