



import { Outlet, NavLink } from "react-router-dom";
import { FiHome, FiPlus, FiBox, FiClipboard, FiUser, FiMenu, FiX } from "react-icons/fi";
import { useState } from "react";
import { useSelector } from "react-redux";

export default function SellerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const darkMode = useSelector(state => state.theme.darkMode);
  return (
    <div className={`min-h-screen flex flex-row transition-colors duration-500 ${darkMode ? 'bg-gray-900' : ''}`}>
      {/* Sidebar for desktop, Drawer for mobile */}
      {/* Mobile menu button */}
      <button
        className={`fixed top-4 left-4 z-40 p-2 rounded-full shadow-lg border md:hidden transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200'}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <FiMenu className={`text-2xl ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} />
      </button>

      {/* Sidebar (hidden on mobile, fixed on desktop) */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 p-6 space-y-4 shadow-xl border-r flex flex-col z-50 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:block
          ${darkMode ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-blue-900 border-gray-700 text-gray-100' : 'bg-gradient-to-b from-blue-50 via-white to-purple-50 border-gray-200 text-gray-700'}
        `}
        style={{ minWidth: '16rem' }}
      >
        {/* Close button for mobile */}
        <button
          className={`absolute top-4 right-4 md:hidden text-2xl transition-colors duration-300 ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-500 hover:text-blue-700'}`}
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <FiX />
        </button>

        <div className="mb-2 mt-8 md:mt-0">
          <span className={`text-xs font-semibold uppercase pl-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Main</span>
        </div>
        <NavLink
          to="/seller/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2 p-3 rounded-lg font-medium transition ${darkMode ? 'hover:bg-blue-900 hover:text-blue-300' : 'hover:bg-blue-100 hover:text-blue-700'} ${isActive ? (darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700') : (darkMode ? 'text-gray-100' : 'text-gray-700')}`
          }
          onClick={() => setSidebarOpen(false)}
        >
          <FiHome className="text-lg" /> Home
        </NavLink>
        <NavLink
          to="/seller/add-product"
          className={({ isActive }) =>
            `flex items-center gap-2 p-3 rounded-lg font-medium transition ${darkMode ? 'hover:bg-blue-900 hover:text-blue-300' : 'hover:bg-blue-100 hover:text-blue-700'} ${isActive ? (darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700') : (darkMode ? 'text-gray-100' : 'text-gray-700')}`
          }
          onClick={() => setSidebarOpen(false)}
        >
          <FiPlus className="text-lg" /> Add Product
        </NavLink>
        <NavLink
          to="/seller/my-products"
          className={({ isActive }) =>
            `flex items-center gap-2 p-3 rounded-lg font-medium transition ${darkMode ? 'hover:bg-blue-900 hover:text-blue-300' : 'hover:bg-blue-100 hover:text-blue-700'} ${isActive ? (darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700') : (darkMode ? 'text-gray-100' : 'text-gray-700')}`
          }
          onClick={() => setSidebarOpen(false)}
        >
          <FiBox className="text-lg" /> My Products
        </NavLink>
        <NavLink
          to="/seller/orders"
          className={({ isActive }) =>
            `flex items-center gap-2 p-3 rounded-lg font-medium transition ${darkMode ? 'hover:bg-blue-900 hover:text-blue-300' : 'hover:bg-blue-100 hover:text-blue-700'} ${isActive ? (darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700') : (darkMode ? 'text-gray-100' : 'text-gray-700')}`
          }
          onClick={() => setSidebarOpen(false)}
        >
          <FiClipboard className="text-lg" /> Orders
        </NavLink>

        <div className="mt-6 mb-2">
          <span className={`text-xs font-semibold uppercase pl-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Account</span>
        </div>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-2 p-3 rounded-lg font-medium transition ${darkMode ? 'hover:bg-blue-900 hover:text-blue-300' : 'hover:bg-blue-100 hover:text-blue-700'} ${isActive ? (darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700') : (darkMode ? 'text-gray-100' : 'text-gray-700')}`
          }
          onClick={() => setSidebarOpen(false)}
        >
          <FiUser className="text-lg" /> Profile
        </NavLink>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className={`flex-1 p-6 md:ml-64 transition-colors duration-500 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
        <Outlet />
      </main>
    </div>
  );
}
        <Outlet />
