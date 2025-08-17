
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Outlet, NavLink, Link } from "react-router-dom";
import { fetchWishlistCount } from "../redux/wishlist.slice";
import { fetchCart } from "../redux/cart.slice";
import { motion } from "framer-motion";
import { FaHeart, FaShoppingCart, FaUserCircle, FaClipboardList, FaStore } from "react-icons/fa";

export default function BuyerLayout() {
  const { count } = useSelector(state => state.wishlist);
  const { items } = useSelector(state => state.cart);
  const { user, token } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user && token) {
      dispatch(fetchWishlistCount());
      dispatch(fetchCart());
    }
  }, [user, token, dispatch]);

  const isBuyer = user && (user.role === "buyer" || user.role === "admin");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-white">
      {/* HEADER */}
      {isBuyer && (
        <motion.header
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 shadow-lg sticky top-0 z-50 backdrop-blur"
        >
          <div className="container mx-auto flex justify-between items-center">
            {/* Logo */}
            <Link to="/store" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight hover:opacity-90">
              <FaStore className="text-3xl" />
              Our Store
            </Link>
            {/* Icons Navbar */}
            <nav className="flex gap-4 items-center">
              {/* Orders */}
              <NavLink
                to="/buyer/orders"
                className={({ isActive }) =>
                  `p-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isActive ? "bg-white text-green-700 scale-105" : "hover:bg-green-700 hover:scale-105"
                  }`
                }
                title="Orders"
              >
                <FaClipboardList size={22} />
              </NavLink>
              {/* Cart */}
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `relative p-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isActive ? "bg-white text-green-700 scale-105" : "hover:bg-green-700 hover:scale-105"
                  }`
                }
                title="Cart"
              >
                <FaShoppingCart size={22} />
                {items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow">
                    {items.length > 9 ? "9+" : items.length}
                  </span>
                )}
              </NavLink>
              {/* Wishlist */}
              <NavLink
                to="/wishlist"
                className={({ isActive }) =>
                  `relative p-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isActive ? "bg-white text-green-700 scale-105" : "hover:bg-green-700 hover:scale-105"
                  }`
                }
                title="Wishlist"
              >
                <FaHeart size={22} />
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </NavLink>
              {/* Profile */}
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `p-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isActive ? "bg-white text-green-700 scale-105" : "hover:bg-green-700 hover:scale-105"
                  }`
                }
                title="Profile"
              >
                <FaUserCircle size={22} />
              </NavLink>
            </nav>
          </div>
        </motion.header>
      )}

      {/* MAIN */}
      <main className="flex-1 p-4 bg-gray-50">
        <div className="container mx-auto">
          <Outlet />
        </div>
      </main>

      {/* FOOTER */}
      {isBuyer && (
        <motion.footer
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 text-center mt-auto shadow-inner"
        >
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="font-semibold">© {new Date().getFullYear()} Our Store. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="#" className="hover:underline hover:text-green-200 transition">About Us</Link>
              <Link to="#" className="hover:underline hover:text-green-200 transition">Contact</Link>
              <Link to="#" className="hover:underline hover:text-green-200 transition">Terms</Link>
            </div>
          </div>
        </motion.footer>
      )}
    </div>
  );
}
