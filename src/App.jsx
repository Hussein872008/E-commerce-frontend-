import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { verifyToken } from "./redux/authSlice";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

import MainLayout from "./components/MainLayout";
import Store from "./pages/buyer/Store";
import Orders from "./pages/buyer/Orders";

import SellerDashboard from "./pages/seller/Dashboard";
import AddProduct from "./pages/seller/AddProduct";
import EditProduct from "./pages/seller/EditProduct";
import MyProducts from "./pages/seller/MyProducts";
import ProductDetails from "./pages/buyer/ProductDetails";
import WishlistPage from "./pages/buyer/WishlistPage";
import Checkout from "./pages/buyer/Checkout";
import CartPage from "./pages/buyer/CartPage";
import SellerOrders from "./pages/seller/Orders";


function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(verifyToken());
  }, [dispatch]);
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<MainLayout role="buyer" />}>
        <Route path="/store" element={<Store />} />
      </Route>


      <Route path="/product/:id" element={<ProductDetails />} />

      <Route
        element={
          <ProtectedRoute allowedRoles={["buyer", "admin"]}>
            <MainLayout role="buyer" />
          </ProtectedRoute>
        }
      >
        <Route path="/buyer/orders" element={<Orders />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/checkout" element={<Checkout />} />
      </Route>

      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute allowedRoles={["seller", "admin"]}>
            <MainLayout role="seller" />
          </ProtectedRoute>
        }
      >
        <Route path="/seller" element={<SellerDashboard />} />
        <Route path="/seller/orders" element={<SellerOrders />} />
        <Route path="/seller/add-product" element={<AddProduct />} />
        <Route path="/seller/edit-product/:id" element={<EditProduct />} />
        <Route path="/seller/my-products" element={<MyProducts />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
