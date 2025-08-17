import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FiStar, FiShoppingCart } from "react-icons/fi";
import { FaHeart, FaTruck, FaRedoAlt } from "react-icons/fa";
import { toast } from 'react-toastify';
import axios from "axios";
import { updateCartStatus, fetchCart } from "../../../redux/cart.slice";
import { incrementWishlistCount, decrementWishlistCount, fetchWishlistCount } from "../../../redux/wishlist.slice";
import QuickViewModal from "./QuickViewModal";

export default function ProductCard({ product }) {
  const { user, token } = useSelector((state) => state.auth);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const dispatch = useDispatch();
  const { isInCart, items } = useSelector((state) => state.cart);
  const isAddedToCart = isInCart[product._id] || false;
  const showRemoveOption = hovered && isAddedToCart;

  const getCartItemId = () => {
    const cartItem = items.find(item => item.product?._id === product._id);
    return cartItem?._id;
  };
  const checkWishlistStatus = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`/api/wishlist/check/${product._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsWishlisted(Boolean(res.data?.isInWishlist));
    } catch (err) {
      console.error("Error checking wishlist:", err);
    }
  };
  const handleWishlistToggle = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!user) {
      toast.error("Please login to manage wishlist");
      return;
    }
    try {
      setIsWishlisted((prev) => !prev);
      if (isWishlisted) dispatch(decrementWishlistCount());
      else dispatch(incrementWishlistCount());
      if (isWishlisted) {
        await axios.delete(`/api/wishlist/${product._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(
          `/api/wishlist`,
          { productId: product._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      dispatch(fetchWishlistCount());
    } catch (err) {
      setIsWishlisted((prev) => !prev);
      if (isWishlisted) dispatch(incrementWishlistCount());
      else dispatch(decrementWishlistCount());
      console.error("Wishlist error:", err);
      toast.error(err.response?.data?.message || "Failed to update wishlist");
    }
  };
  const handleAddToCart = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!user) {
      toast.error("You must be logged in to add products to cart");
      return;
    }
    if (product.quantity <= 0) {
      toast.error("This product is out of stock");
      return;
    }
    setCartLoading(true);
    try {
      dispatch(updateCartStatus({ productId: product._id, isInCart: true }));
      const response = await axios.post(
        `/api/cart/add`,
        { productId: product._id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data?.success) {
        await dispatch(fetchCart());
      }
    } catch (err) {
      dispatch(updateCartStatus({ productId: product._id, isInCart: false }));
      console.error("Error adding to cart:", err);
      const errorMsg = err.response?.data?.error || "Failed to add to cart";
      if (err.response?.data?.available)
        toast.error(`Only ${err.response.data.available} available in stock`);
      else toast.error(errorMsg);
    } finally {
      setCartLoading(false);
    }
  };
  const handleRemoveFromCart = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!user) {
      toast.error("You must be logged in to remove products from cart");
      return;
    }
    const cartItemId = getCartItemId();
    if (!cartItemId) {
      toast.error("Product not found in cart");
      return;
    }
    setCartLoading(true);
    try {
      dispatch(updateCartStatus({ productId: product._id, isInCart: false }));
      await axios.delete(`/api/cart/remove/${cartItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await dispatch(fetchCart());
    } catch (err) {
      dispatch(updateCartStatus({ productId: product._id, isInCart: true }));
      console.error("Error removing product from cart:", err);
      toast.error(err.response?.data?.error || "Failed to remove from cart");
    } finally {
      setCartLoading(false);
    }
  };
  useEffect(() => {
    checkWishlistStatus();
  }, [user, token, product._id]);
  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length
        ).toFixed(1)
      : null;
  return (
    <>
      <div
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1 relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Link to={`/product/${product._id}`} className="block">
          <div className="relative aspect-square overflow-hidden">
            <img
              src={
                product.image?.startsWith?.("http")
                  ? product.image
                  : `${product.image}`
              }
              alt={product.title}
              className={`w-full h-full object-cover transition-transform duration-300 ${
                hovered ? "scale-105" : "scale-100"
              }`}
              loading="lazy"
              onError={(e) => (e.target.src = "/placeholder-product.png")}
            />
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.discountPercentage > 0 && (
                <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                  {product.discountPercentage}% OFF
                </span>
              )}
            </div>
            {product.extraImages?.length > 0 && (
              <div className="absolute bottom-2 left-2 flex gap-1">
                {product.extraImages.slice(0, 3).map((img, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 border border-white rounded-sm overflow-hidden"
                  >
                    <img
                      src={img}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-1">
              <h2 className="font-semibold text-lg hover:text-green-600 line-clamp-1 transition-colors">
                {product.title}
              </h2>
              <div className="flex items-center text-sm text-yellow-500">
                <FiStar className="fill-current mr-1" />
                {averageRating || "No reviews"}
                {reviews.length > 0 && (
                  <span className="text-gray-400 text-xs ml-1">
                    ({reviews.length})
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-1 text-xs">
              {product.brand && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded transition-all hover:bg-gray-200">
                  {product.brand}
                </span>
              )}
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded transition-all hover:bg-gray-200">
                {product.category}
              </span>
            </div>
            <p className="text-gray-500 text-sm my-2 line-clamp-2">
              {product.description}
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              {product.shippingInformation && (
                <div className="flex items-center gap-1">
                  <FaTruck className="text-gray-400 text-xs" />
                  <span>{product.shippingInformation}</span>
                </div>
              )}
              {product.returnPolicy && (
                <div className="flex items-center gap-1">
                  <FaRedoAlt className="text-gray-400 text-xs" />
                  <span>{product.returnPolicy}</span>
                </div>
              )}
            </div>
            <div className="text-xs mt-2">
              {product.quantity > 0 ? (
                <span className="text-green-600">
                  In Stock ({product.quantity})
                </span>
              ) : (
                <span className="text-red-600">Out of Stock</span>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <div>
                {(product.discountPercentage && product.originalPrice) ? (
                  <>
                    <p className="text-green-600 font-bold">
                      ${(
                        product.originalPrice - (product.originalPrice * product.discountPercentage / 100)
                      ).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 line-through">
                      ${Number(product.originalPrice).toFixed(2)}
                    </p>
                    <span className="ml-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      {Math.round(product.discountPercentage)}% OFF
                    </span>
                  </>
                ) : product.originalPrice ? (
                  <p className="text-green-600 font-bold">
                    ${Number(product.originalPrice).toFixed(2)}
                  </p>
                ) : (
                  <p className="text-green-600 font-bold">
                    ${Number(product.price).toFixed(2)}
                  </p>
                )}
              </div>
              <button
                onClick={
                  isAddedToCart ? handleRemoveFromCart : handleAddToCart
                }
                disabled={product.quantity <= 0 || cartLoading}
                className={`p-2 rounded-full transition-all ${
                  isAddedToCart
                    ? showRemoveOption
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-green-100 text-green-600"
                    : "bg-green-100 text-green-600 hover:bg-green-200"
                }`}
                aria-label={
                  isAddedToCart
                    ? showRemoveOption
                      ? "Remove from cart"
                      : "Added to cart"
                    : "Add to cart"
                }
              >
                {cartLoading ? (
                  <span className="animate-pulse">...</span>
                ) : isAddedToCart ? (
                  showRemoveOption ? (
                    <span>✕</span>
                  ) : (
                    <span>✓</span>
                  )
                ) : (
                  <FiShoppingCart />
                )}
              </button>
            </div>
          </div>
        </Link>
        {hovered && (
          <button
            className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white text-green-600 px-4 py-2 rounded-lg shadow-md hover:bg-green-50 transition-all"
            onClick={(e) => {
              e.preventDefault();
              setShowQuickView(true);
            }}
          >
            Quick View
          </button>
        )}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 right-2 p-2 rounded-full z-10 transition-all ${
            isWishlisted
              ? "text-red-500 bg-red-50 hover:bg-red-100"
              : hovered
              ? "text-red-400 bg-white hover:bg-gray-100"
              : "text-gray-400 bg-white"
          }`}
          title={
            isWishlisted ? "Remove from wishlist" : "Add to wishlist"
          }
          aria-label={
            isWishlisted ? "Remove from wishlist" : "Add to wishlist"
          }
        >
          <FaHeart className={isWishlisted ? "fill-current" : ""} />
        </button>
      </div>
      {showQuickView && (
        <QuickViewModal
          product={product}
          onClose={() => setShowQuickView(false)}
          onAddToCart={handleAddToCart}
          onWishlistToggle={handleWishlistToggle}
          isWishlisted={isWishlisted}
        />
      )}
    </>
  );
}
