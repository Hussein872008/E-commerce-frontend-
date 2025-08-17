import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiX, FiStar, FiShoppingCart } from "react-icons/fi";
import { FaHeart, FaTrashAlt } from "react-icons/fa";
import { toast } from 'react-toastify';
import axios from "axios";
import { updateCartStatus, fetchCart } from "../../../redux/cart.slice";
import { FiHeart } from "react-icons/fi";
export default function QuickViewModal({ product, onClose, onAddToCart, onWishlistToggle, isWishlisted }) {
  const dispatch = useDispatch();
  const { isInCart, items } = useSelector((state) => state.cart);
  const { token } = useSelector((state) => state.auth);
  const isAddedToCart = isInCart[product._id] || false;
  const [cartLoading, setCartLoading] = useState(false);

  const handleRemoveFromCart = async () => {
    setCartLoading(true);
    try {
      const cartItem = items.find(item => item.product?._id === product._id);
      if (!cartItem) {
        toast.error("Product not found in cart");
        setCartLoading(false);
        return;
      }
      dispatch(updateCartStatus({ productId: product._id, isInCart: false }));
      await axios.delete(`/api/cart/remove/${cartItem._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await dispatch(fetchCart());
    } catch (err) {
      dispatch(updateCartStatus({ productId: product._id, isInCart: true }));
      toast.error(err.response?.data?.error || "Failed to remove from cart");
    } finally {
      setCartLoading(false);
    }
  };

  const reviews = Array.isArray(product?.reviews) ? product.reviews : [];
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;
  const shortDescription = product.description?.length > 150
    ? product.description.slice(0, 150) + "..."
    : product.description;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">{product.title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors" aria-label="Close modal">
              <FiX size={24} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square">
                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(product.extraImages || []).map((img, idx) => (
                  <div key={idx} className="aspect-square bg-gray-100 rounded overflow-hidden">
                    <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center mb-2">
                <div className="flex items-center text-yellow-500 mr-4">
                  <FiStar className="fill-current mr-1" />
                  {averageRating || 'No reviews'}
                </div>
                <span className="text-gray-500 text-sm">{reviews.length} reviews</span>
              </div>
              <div className="mb-4 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-green-600">${Number(product.price).toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="text-gray-500 line-through">${Number(product.originalPrice).toFixed(2)}</span>
                )}
                {product.discountPercentage > 0 && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                    {product.discountPercentage}% OFF
                  </span>
                )}
              </div>
              <p className="text-gray-700 mb-6">{shortDescription}</p>
              <div className="space-y-3 mb-6 text-gray-700">
                <div className="flex items-center">
                  <span className="w-32 font-semibold">Availability:</span>
                  <span className={product.quantity > 0 ? "text-green-600" : "text-red-600"}>
                    {product.quantity > 0 ? `In Stock (${product.quantity})` : "Out of Stock"}
                  </span>
                </div>
                {product.brand && (
                  <div className="flex items-center">
                    <span className="w-32 font-semibold">Brand:</span>
                    <span>{product.brand}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="w-32 font-semibold">Category:</span>
                  <span>{product.category}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {isAddedToCart ? (
                  <button
                    onClick={handleRemoveFromCart}
                    disabled={cartLoading}
                    className={`flex-1 flex items-center justify-center py-3 px-6 rounded-lg transition-all ${
                      product.quantity > 0 ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {cartLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Removing...
                      </span>
                    ) : (
                      <>
                        <FaTrashAlt className="mr-2" />
                        Remove from Cart
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={onAddToCart}
                    disabled={product.quantity <= 0 || cartLoading}
                    className={`flex-1 flex items-center justify-center py-3 px-6 rounded-lg transition-all ${
                      product.quantity > 0 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {cartLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </span>
                    ) : (
                      <>
                        <FiShoppingCart className="mr-2" />
                        Add to Cart
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={onWishlistToggle}
                  className={`p-3 rounded-lg border transition-all ${
                    isWishlisted ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  {isWishlisted ? <FaHeart /> : <FiHeart />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
