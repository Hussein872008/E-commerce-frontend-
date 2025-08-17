import React, { useEffect, useState, useCallback, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiTrash2, FiPlus, FiMinus, FiShoppingCart, FiAlertCircle, FiX } from 'react-icons/fi';
import { fetchCart, removeFromCart, updateCartItem, clearCart } from '../../redux/cart.slice';
import { toast } from 'react-toastify';

const ImageWithFallback = ({ src, alt, className }) => {
  const [error, setError] = useState(false);
  return (
    <img
      src={error ? '/placeholder-product.png' : src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};

const ConfirmationModal = memo(({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isLoading = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 id="modal-title" className="text-lg font-bold">{title}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close modal" disabled={isLoading}>
              <FiX size={20} />
            </button>
          </div>
          <p id="modal-desc" className="text-gray-700 mb-6">{message}</p>
          <div className="flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" disabled={isLoading}>{cancelText}</button>
            <button onClick={onConfirm} className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`} disabled={isLoading}>
              {isLoading && <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const CartPage = () => {
  const { items, loading, error } = useSelector(state => state.cart);
  const { token, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [updatingItems, setUpdatingItems] = useState({});
  const [itemToRemove, setItemToRemove] = useState(null);
  const [removingLoading, setRemovingLoading] = useState(false);

  useEffect(() => {
    if (token && user?._id) {
      dispatch(fetchCart());
    }
  }, [dispatch, token, user]);



const handleUpdateQuantity = useCallback(async (itemId, newQuantity) => {


    if (newQuantity < 1 || newQuantity > 10) {
        toast.warning('Quantity must be between 1 and 10');
        return;
    }

    setUpdatingItems(prev => ({ ...prev, [itemId]: true }));
    try {
        await dispatch(updateCartItem({ itemId, quantity: newQuantity })).unwrap();
    } catch (err) {
        console.error('Update quantity error:', err);
        toast.error(err.response?.data?.error || 'Failed to update quantity');
    } finally {
        setUpdatingItems(prev => ({ ...prev, [itemId]: false }));
    }
}, [dispatch, token, user?._id]);

const handleRemoveItem = useCallback(async (itemId) => {


    setRemovingLoading(true);
    try {
        await dispatch(removeFromCart(itemId)).unwrap();
        toast.success('Product removed from cart successfully');
        setItemToRemove(null);
    } catch (err) {
        console.error('Remove item error:', err);
        toast.error(err.message || 'Failed to remove product from cart');
    } finally {
        setRemovingLoading(false);
    }
}, [dispatch, token, user?._id]);

  const handleClearCart = useCallback(async () => {
    if (!token || !user?._id) {
      toast.error('User not authenticated');
      return;
    }

    if (!window.confirm('Are you sure you want to clear the entire cart?')) return;

    try {
      await dispatch(clearCart()).unwrap();
      toast.success('Cart cleared successfully');
    } catch (err) {
      toast.error('Failed to clear cart');
    }
  }, [dispatch, token, user?._id]);

  if (loading && items.length === 0) return <div className="flex justify-center items-center h-64" aria-live="polite"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div></div>;

  if (error) return (
    <div className="container mx-auto p-4 text-center" role="alert">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 max-w-2xl mx-auto">
        <div className="flex items-center"><FiAlertCircle className="text-red-500 text-xl mr-2" /><p className="text-red-700">{error}</p></div>
        <button onClick={() => dispatch(fetchCart())} className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">Try Again</button>
      </div>
    </div>
  );

  // Calculate total directly from items for accuracy
  const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const productCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) return (
    <div className="container mx-auto p-8 text-center h-full flex flex-col items-center justify-center">
      <FiShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
      <p className="text-gray-500 mb-6">Your cart is empty</p>
      <Link to="/store" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Browse Store</Link>
    </div>
  );

  return (
    <div className="container mx-auto p-4 max-w-6xl" aria-live="polite">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

      <div className="flex justify-end mb-4">
        <button onClick={handleClearCart} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors" aria-label="Clear entire cart">Clear Cart</button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Items List */}
          <div className="md:col-span-2 p-4">
            <div className="divide-y divide-gray-200">
              {items.map((item, index) => {
                if (!item.product) return null;
                const productId = item.product._id || `fallback-${index}`;
                const key = item._id || productId;
                const productImage = item.product.image || item.product.thumbnail || (Array.isArray(item.product.images) && item.product.images.length > 0 ? item.product.images[0] : '/placeholder-product.png');
                const productTitle = item.product.title || 'Untitled Product';
                const isUpdating = updatingItems[item._id];
                const isDisabled = isUpdating || removingLoading;

                // Instant feedback for out of stock or over quantity
                if (item.product.quantity <= 0) {
                  toast.error(`Product "${productTitle}" is out of stock!`);
                }
                if (item.quantity > item.product.quantity) {
                  toast.warning(`Quantity for "${productTitle}" exceeds available stock!`);
                }

                return (
                  <div key={key} className="py-4 flex items-start gap-4" aria-label={`Cart item: ${productTitle}`}>
                    <Link to={`/product/${productId}`} className="flex-shrink-0 w-20 h-20 relative">
                      <ImageWithFallback src={productImage} alt={productTitle} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                      {item.product.quantity <= 0 && <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg"><span className="text-white text-xs font-bold">Out of Stock</span></div>}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <Link to={`/product/${productId}`} className="font-medium hover:text-green-600 transition-colors truncate" title={productTitle}>{productTitle}</Link>
                        <p className="font-bold text-green-600 ml-2 whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>

                      {item.product.quantity <= 0 ? <p className="text-red-500 text-sm mt-1">This product is currently unavailable</p> : (
                        <div className="flex items-center mt-3">
                          <button onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)} disabled={item.quantity <= 1 || isDisabled} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label={`Decrease quantity of ${productTitle}`} aria-disabled={item.quantity <= 1 || isDisabled}><FiMinus size={14} /></button>
                          <input type="number" min={1} max={item.product.quantity} value={item.quantity} disabled={isDisabled} onChange={(e) => { const val = parseInt(e.target.value, 10); if (!isNaN(val)) handleUpdateQuantity(item._id, val); }} className="w-12 text-center border rounded px-2 py-1 mx-2" aria-label={`Quantity input for ${productTitle}`} />
                          <button onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)} disabled={isDisabled || item.quantity >= item.product.quantity} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label={`Increase quantity of ${productTitle}`} aria-disabled={isDisabled || item.quantity >= item.product.quantity}><FiPlus size={14} /></button>
                          {isUpdating && <div className="ml-3 h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>}
                        </div>
                      )}
                    </div>

                    <button onClick={() => setItemToRemove(item._id)} disabled={isDisabled} className="text-red-500 hover:text-red-700 p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label={`Remove ${productTitle} from cart`}>
                      <FiTrash2 />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between"><span>Products:</span><span>{productCount}</span></div>
              <div className="flex justify-between"><span>Subtotal:</span><span>${calculatedTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping:</span><span className="text-green-600">Free</span></div>
              <div className="border-t border-gray-200 pt-4 flex justify-between text-lg font-bold"><span>Total:</span><span>${calculatedTotal.toFixed(2)}</span></div>
              <Link to="/checkout" className="block w-full bg-green-600 text-white py-3 text-center rounded-lg hover:bg-green-700 transition-colors font-medium mt-6">Proceed to Checkout</Link>
              <Link to="/store" className="block w-full mt-2 text-center text-green-600 hover:underline">Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!itemToRemove}
        onClose={() => setItemToRemove(null)}
        onConfirm={() => handleRemoveItem(itemToRemove)}
        title="Remove Product from Cart"
        message={`Are you sure you want to remove "${items.find(i => i._id === itemToRemove)?.product.title}" from your cart?`}
        confirmText="Yes, Remove"
        cancelText="Cancel"
        isLoading={removingLoading}
      />
    </div>
  );
};

export default CartPage;