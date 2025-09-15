import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiTrash2, FiPlus, FiMinus, FiShoppingCart, FiAlertCircle, FiX } from 'react-icons/fi';
import { fetchCart, removeFromCart, updateCartItem, clearCart, clearCartThunk } from '../../redux/cart.slice';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const ImageWithFallback = ({ src, alt, className }) => {
  const [error, setError] = useState(false);
  return (
    <img
      src={error ? '/placeholder-image.webp' : src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};




const CartPage = () => {
  const { items, loading, error } = useSelector(state => state.cart);
  const { token, user } = useSelector(state => state.auth);
  const darkMode = useSelector(state => state.theme.darkMode);
  const dispatch = useDispatch();

  const [updatingItems, setUpdatingItems] = useState({});
  const [removingLoading, setRemovingLoading] = useState(false);
  const [alerts, setAlerts] = useState({}); 
  const alertTimers = React.useRef({});

  const showInlineAlert = (itemId, text, type = 'warning', timeout = 2000) => {
    setAlerts(prev => ({ ...prev, [itemId]: { text, type } }));
    if (alertTimers.current[itemId]) clearTimeout(alertTimers.current[itemId]);
    alertTimers.current[itemId] = setTimeout(() => {
      setAlerts(prev => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });
      delete alertTimers.current[itemId];
    }, timeout);
  };

  useEffect(() => {
    if (token && user?._id) {
      dispatch(fetchCart());
    }
  }, [dispatch, token, user]);



const handleUpdateQuantity = useCallback(async (itemId, newQuantity) => {
  const item = items.find(i => i._id === itemId);
  if (!item || !item.product) {
    toast.error('Cart item not found');
    return;
  }

  const minQty = item.product.minimumOrderQuantity && item.product.minimumOrderQuantity > 0 ? item.product.minimumOrderQuantity : 1;
  const stock = typeof item.product.quantity === 'number' ? item.product.quantity : 0;
  const appMax = 10; 
  const maxAllowed = Math.min(stock > 0 ? stock : appMax, appMax);

  if (stock <= 0) {
    toast.error(`Product "${item.product.title || 'Item'}" is out of stock`);
    return;
  }

  if (newQuantity < minQty) {
    toast.warning(`Minimum order quantity for "${item.product.title || 'Item'}" is ${minQty}`);
    return;
  }

  if (newQuantity > maxAllowed) {
    toast.warning(`Maximum available quantity for "${item.product.title || 'Item'}" is ${maxAllowed}`);
    return;
  }

  setUpdatingItems(prev => ({ ...prev, [itemId]: true }));
  try {
    await dispatch(updateCartItem({ itemId, quantity: newQuantity })).unwrap();
  } catch (err) {
    console.error('Update quantity error:', err);
  const msg = typeof err === 'string' ? err : (err?.response?.data?.error || err?.message || 'Failed to update quantity');
  toast.error(msg);
  } finally {
    setUpdatingItems(prev => ({ ...prev, [itemId]: false }));
  }
}, [dispatch, token, user?._id, items]);


const handleRemoveItem = useCallback(async (itemId, productTitle) => {
  const result = await Swal.fire({
    title: 'Remove Product from Cart',
    text: `Are you sure you want to remove "${productTitle}" from your cart?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Remove',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-lg',
      cancelButton: 'bg-gray-200 text-gray-700 px-4 py-2 rounded-lg',
    },
  });
  if (!result.isConfirmed) return;
  setRemovingLoading(true);
  try {
    await dispatch(removeFromCart(itemId)).unwrap();
    toast.success('Product removed from cart successfully');
  } catch (err) {
    console.error('Remove item error:', err);
    toast.error(err.message || 'Failed to remove product from cart');
  } finally {
    setRemovingLoading(false);
  }
}, [dispatch, token, user?._id]);

  const handleClearCart = useCallback(async () => {
    const result = await Swal.fire({
      title: 'Clear Cart',
      text: 'Are you sure you want to clear the entire cart?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Clear',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-lg',
        cancelButton: 'bg-gray-200 text-gray-700 px-4 py-2 rounded-lg',
      },
    });
    if (!result.isConfirmed) return;
    try {
      await dispatch(clearCartThunk()).unwrap();
      toast.success('Cart cleared successfully');
    } catch (err) {
      toast.error('Failed to clear cart');
    }
  }, [dispatch, token, user?._id]);

  if (loading && items.length === 0) return (
    <div className={`container mx-auto p-4 max-w-6xl`} aria-live="polite">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className={`flex items-center gap-4 p-4 rounded-lg transition-colors duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`w-20 h-20 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
              <div className="flex-1">
                <div className={`h-4 w-3/4 mb-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-3 w-1/3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className="mt-3 flex items-center gap-2">
                  <div className={`h-8 w-24 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                  <div className={`h-8 w-10 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                </div>
              </div>
              <div className={`h-6 w-6 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            </div>
          ))}
        </div>

        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50'}`}>
          <div className={`h-6 w-1/2 mb-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className="space-y-3">
            <div className={`h-4 w-full rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            <div className={`h-4 w-3/4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            <div className={`h-10 w-full mt-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="container mx-auto p-4 text-center" role="alert">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 max-w-2xl mx-auto">
        <div className="flex items-center"><FiAlertCircle className="text-red-500 text-xl mr-2" /><p className="text-red-700">{error}</p></div>
        <button onClick={() => dispatch(fetchCart())} className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">Try Again</button>
      </div>
    </div>
  );

  const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const productCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) return (
    <div className="container mx-auto p-8 flex items-center justify-center min-h-screen">
      <div className={`w-full max-w-3xl rounded-2xl p-10 md:p-16 text-center transition-colors duration-300 shadow-xl ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-800 text-blue-50' : 'bg-white'} `} role="region" aria-label="Empty cart">
        <div className="flex flex-col items-center gap-6">
          <div className={`flex items-center justify-center rounded-full p-6 ${darkMode ? 'bg-gradient-to-br from-indigo-700 to-blue-700' : 'bg-green-50'}`}>
            <FiShoppingCart size={72} className={`${darkMode ? 'text-white' : 'text-green-600'}`} />
          </div>

          <h2 className={`text-2xl md:text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Your cart is empty</h2>

          <p className={`max-w-xl text-sm md:text-base ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Looks like you haven't added any products yet. Browse our store to find great deals and add items to your cart.
          </p>

          <div className="mt-4">
            <Link to="/store" className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md font-medium">Browse Store</Link>
          </div>

          <div className={`mt-6 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Tip: Add items from the <Link to="/store" className={`underline ${darkMode ? 'text-blue-200' : 'text-green-600'}`}>store</Link> to start your order.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`container mx-auto p-4 max-w-6xl transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-blue-100' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-800'}`} aria-live="polite">
      <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Shopping Cart</h1>

      <div className="flex justify-end mb-4">
        <button onClick={handleClearCart} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-red-400" aria-label="Clear entire cart">Clear Cart</button>
      </div>

      <div className={`rounded-lg shadow-md overflow-hidden transition-all duration-300 ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'}` }>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-4">
            <div className="divide-y divide-gray-200">
              {items.map((item, index) => {
                if (!item.product) return null;
                const productId = item.product._id || `fallback-${index}`;
                const key = item._id || productId;
                const productImage = item.product.image || item.product.thumbnail || (Array.isArray(item.product.images) && item.product.images.length > 0 ? item.product.images[0] : '/placeholder-image.webp');
                const productTitle = item.product.title || 'Untitled Product';
                const isUpdating = updatingItems[item._id];
                const isDisabled = isUpdating || removingLoading;

                const minQty = item.product.minimumOrderQuantity && item.product.minimumOrderQuantity > 0 ? item.product.minimumOrderQuantity : 1;
                const stock = typeof item.product.quantity === 'number' ? item.product.quantity : 0;
              const appMax = 10;
              const maxAllowed = Math.min(stock > 0 ? stock : appMax, appMax);

                return (
                  <div key={key} className="py-4 flex items-start gap-4 group transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg" aria-label={`Cart item: ${productTitle}`}>
                    <Link to={`/product/${productId}`} className="flex-shrink-0 w-20 h-20 relative p-1">
                      <ImageWithFallback src={productImage} alt={productTitle} className="w-full h-full object-contain rounded-lg border border-gray-200 bg-white/5 p-1" />
                      {item.product.quantity <= 0 && (
                        <div className={`absolute inset-0 flex items-center justify-center rounded-lg ${darkMode ? 'bg-white bg-opacity-10' : 'bg-black bg-opacity-10'}`}>
                          <span className={`${darkMode ? 'text-gray-900' : 'text-white'} text-xs font-bold`}>Out of Stock</span>
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <Link to={`/product/${productId}`} className="font-medium hover:text-green-600 transition-colors truncate" title={productTitle}>{productTitle}</Link>
                        <p className="font-bold text-green-600 ml-2 whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>

                      {stock <= 0 ? (
                        <p className="text-red-500 text-sm mt-1">This product is currently unavailable</p>
                      ) : (
                        <div className="flex items-center mt-3">
                          <button
                            onClick={() => {
                              const newQ = item.quantity - 1;
                              if (stock <= 0) {
                                showInlineAlert(item._id, `Product out of stock`, 'error');
                                return;
                              }
                              if (newQ < minQty) {
                                showInlineAlert(item._id, `Minimum is ${minQty}`);
                                return;
                              }
                              if (newQ > maxAllowed) {
                                if (stock > 0 && stock < appMax) showInlineAlert(item._id, `Maximum available is ${stock}`);
                                else showInlineAlert(item._id, `Maximum per order is ${appMax}`);
                                return;
                              }
                              handleUpdateQuantity(item._id, newQ);
                            }}
                            className={`p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-200 ${item.quantity <= minQty || isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            aria-label={`Decrease quantity of ${productTitle}`}
                            aria-disabled={item.quantity <= minQty || isDisabled}
                          ><FiMinus size={14} /></button>

                          <div className="flex items-center">
                          <input
                            type="number"
                            min={minQty}
                            max={maxAllowed}
                            value={item.quantity}
                            disabled={isDisabled}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (isNaN(val)) return;
                              if (stock <= 0) {
                                showInlineAlert(item._id, `Product out of stock`, 'error');
                                return;
                              }
                              if (val < minQty) {
            showInlineAlert(item._id, `Minimum is ${minQty}`);
                                return;
                              }
                              if (val > maxAllowed) {
                                if (stock > 0 && stock < appMax) showInlineAlert(item._id, `Maximum available is ${stock}`);
                                else showInlineAlert(item._id, `Maximum per order is ${appMax}`);
                                return;
                              }
                              handleUpdateQuantity(item._id, val);
                            }}
                            className="w-12 text-center border rounded px-2 py-1 mx-2"
                            aria-label={`Quantity input for ${productTitle}`}
                          />
                          {minQty > 1 && (
                            <span className="text-xs ml-2 px-2 py-1 rounded-md bg-yellow-100 text-yellow-800">Min: {minQty}</span>
                          )}
                          </div>

                          <button
                            onClick={() => {
                              const newQ = item.quantity + 1;
                              if (stock <= 0) {
                                showInlineAlert(item._id, `Product out of stock`, 'error');
                                return;
                              }
                              if (newQ < minQty) {
                                showInlineAlert(item._id, `Minimum is ${minQty}`);
                                return;
                              }
                              if (newQ > maxAllowed) {
                                if (stock > 0 && stock < appMax) showInlineAlert(item._id, `Maximum available is ${stock}`);
                                else showInlineAlert(item._id, `Maximum per order is ${appMax}`);
                                return;
                              }
                              handleUpdateQuantity(item._id, newQ);
                            }}
                            className={`p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-200 ${isDisabled || item.quantity >= maxAllowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                            aria-label={`Increase quantity of ${productTitle}`}
                            aria-disabled={isDisabled || item.quantity >= maxAllowed}
                          ><FiPlus size={14} /></button>

                          {isUpdating && <div className="ml-3 h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>}
                        </div>
                      )}

                      {stock > 0 && item.quantity > stock && (
                        <p className="text-yellow-600 text-sm mt-1">Requested quantity exceeds available stock ({stock})</p>
                      )}

                      {alerts[item._id] && (
                        <div className={`mt-2 text-sm ${alerts[item._id].type === 'error' ? 'text-red-500' : 'text-yellow-600'}`} role="status">
                          {alerts[item._id].text}
                        </div>
                      )}
                    </div>

                    <button onClick={() => handleRemoveItem(item._id, productTitle)} disabled={isDisabled} className="text-red-500 hover:text-red-700 p-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" aria-label={`Remove ${productTitle} from cart`}>
                      <FiTrash2 />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-inner transition-all duration-300 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50'}`}>
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between"><span>Products:</span><span>{productCount}</span></div>
              <div className="flex justify-between"><span>Subtotal:</span><span>${calculatedTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping:</span><span className="text-green-600">Free</span></div>
              <div className="border-t border-gray-200 pt-4 flex justify-between text-lg font-bold"><span>Total:</span><span>${calculatedTotal.toFixed(2)}</span></div>
              <Link to="/checkout" className="block w-full bg-green-600 text-white py-3 text-center rounded-lg hover:bg-green-700 transition-all duration-200 font-medium mt-6 shadow-md">Proceed to Checkout</Link>
              <Link to="/store" className="block w-full mt-2 text-center text-green-600 hover:underline">Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CartPage;