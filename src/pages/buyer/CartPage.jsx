import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiTrash2, FiPlus, FiMinus, FiShoppingCart, FiAlertCircle, FiX, FiArrowLeft } from 'react-icons/fi';
import { fetchCart, removeFromCart, updateCartItem, clearCart, clearCartThunk } from '../../redux/cart.slice';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const ImageWithFallback = React.memo(({ src, alt, className }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative">
      <img
        src={error ? '/placeholder-image.webp' : src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
        loading="lazy"
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
      />
      {loading && (
        <div className={`absolute inset-0 animate-pulse ${className.includes('bg-') ? '' : 'bg-gray-200 dark:bg-gray-700'}`} />
      )}
    </div>
  );
});

const CartPage = () => {
  const { items, loading, error } = useSelector(state => state.cart);
  const { token, user } = useSelector(state => state.auth);
  const darkMode = useSelector(state => state.theme.darkMode);
  const dispatch = useDispatch();
  const themeClasses = useMemo(() => ({
    text: {
      primary: darkMode ? 'text-gray-100' : 'text-gray-900',
      secondary: darkMode ? 'text-gray-300' : 'text-gray-600',
      accent: darkMode ? 'text-green-300' : 'text-green-700',
      danger: darkMode ? 'text-red-300' : 'text-red-600',
      warning: darkMode ? 'text-yellow-300' : 'text-yellow-600',
    },
    bg: {
      primary: darkMode ? 'bg-gray-900' : 'bg-white',
      secondary: darkMode ? 'bg-gray-800' : 'bg-gray-50',
      card: darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200',
      overlay: darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
    },
    button: {
      primary: darkMode ? 
        'bg-green-600 hover:bg-green-500 text-white focus:ring-green-400' : 
        'bg-green-600 hover:bg-green-700 text-white focus:ring-green-400',
      danger: darkMode ? 
        'bg-red-600 hover:bg-red-500 text-white focus:ring-red-400' : 
        'bg-red-600 hover:bg-red-700 text-white focus:ring-red-400',
      neutral: darkMode ? 
        'bg-gray-700 hover:bg-gray-600 text-gray-200 focus:ring-gray-400' : 
        'bg-gray-100 hover:bg-gray-200 text-gray-600 focus:ring-gray-400',
      outline: darkMode ?
        'border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-gray-100' :
        'border border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800',
    },
    input: darkMode ? 
      'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-green-400 focus:ring-green-400' : 
      'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-green-500 focus:ring-green-400',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
    divide: darkMode ? 'divide-gray-700' : 'divide-gray-200',
  }), [darkMode]);

  const [updatingItems, setUpdatingItems] = useState({});
  const [removingLoading, setRemovingLoading] = useState(false);
  const [alerts, setAlerts] = useState({}); 
  const alertTimers = React.useRef({});

  const { calculatedTotal, productCount, itemCount } = useMemo(() => {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const distinctProducts = items.length;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    
    return {
      calculatedTotal: total,
      productCount: distinctProducts,
      itemCount: totalItems
    };
  }, [items]);

  const showInlineAlert = useCallback((itemId, text, type = 'warning', timeout = 2000) => {
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
  }, []);

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

    const minQty = item.product.minimumOrderQuantity && item.product.minimumOrderQuantity > 0 ? 
      item.product.minimumOrderQuantity : 1;
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
  }, [dispatch, items]);

  const handleRemoveItem = useCallback(async (itemId, productTitle) => {
    setRemovingLoading(true);
    try {
      await dispatch(removeFromCart(itemId)).unwrap();
      toast.success(`Removed "${productTitle}" from cart`);
    } catch (err) {
      console.error('Remove item error:', err);
      const msg = typeof err === 'string' ? err : (err?.response?.data?.error || err?.message || 'Failed to remove product from cart');
      toast.error(msg);
    } finally {
      setRemovingLoading(false);
    }
  }, [dispatch]);

  const handleClearCart = useCallback(async () => {
    const result = await Swal.fire({
      title: 'Clear Cart',
      html: `
        <div class="text-left">
          <p class="mb-3">Are you sure you want to clear your entire cart?</p>
          <p class="text-sm opacity-75">This will remove ${itemCount} item${itemCount !== 1 ? 's' : ''} from your cart.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Clear Cart',
      cancelButtonText: 'Keep Items',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: 'rounded-xl',
        confirmButton: `${themeClasses.button.danger} !px-6 !py-3 !rounded-lg !font-medium transition-colors`,
        cancelButton: `${themeClasses.button.outline} !px-6 !py-3 !rounded-lg !font-medium transition-colors`,
      },
      background: themeClasses.bg.primary.replace('bg-', ''),
      color: themeClasses.text.primary.replace('text-', ''),
      iconColor: darkMode ? '#f97316' : '#ea580c',
    });

    if (!result.isConfirmed) return;
    
    try {
      await dispatch(clearCartThunk()).unwrap();
      toast.success('Cart cleared successfully');
    } catch (err) {
      toast.error('Failed to clear cart');
    }
  }, [dispatch, itemCount, themeClasses, darkMode]);

  if (loading && items.length === 0) return (
    <div className={`min-h-screen ${themeClasses.bg.overlay} transition-colors duration-500`}>
      <div className="container mx-auto p-4 max-w-6xl" aria-live="polite" aria-label="Loading cart">
        <div className="mb-6">
          <div className={`h-8 w-48 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse mb-4`}></div>
          <div className={`h-4 w-64 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className={`flex items-start gap-4 p-4 rounded-xl transition-colors duration-200 ${themeClasses.bg.card}`}>
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1">
                      <div className={`h-5 w-3/4 mb-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                      <div className={`h-4 w-1/2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                    </div>
                    <div className={`h-6 w-20 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className={`h-10 w-24 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                    <div className={`h-10 w-10 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`p-6 rounded-xl ${themeClasses.bg.card}`}>
            <div className={`h-6 w-32 mb-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className={`h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse ${i === 4 ? 'w-3/4' : 'w-full'}`}></div>
              ))}
              <div className={`h-12 w-full mt-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className={`min-h-screen flex items-center justify-center ${themeClasses.bg.overlay} transition-colors duration-500`}>
      <div className="container mx-auto p-4 text-center max-w-2xl" role="alert">
        <div className={`p-6 rounded-2xl ${themeClasses.bg.card} shadow-lg`}>
          <div className="flex flex-col items-center gap-4">
            <FiAlertCircle className={`text-4xl ${themeClasses.text.danger}`} />
            <h2 className={`text-xl font-bold ${themeClasses.text.primary}`}>Unable to Load Cart</h2>
            <p className={`${themeClasses.text.secondary} text-center`}>{error}</p>
            <button 
              onClick={() => dispatch(fetchCart())} 
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${themeClasses.button.primary} mt-4`}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (items.length === 0) return (
    <div className={`min-h-screen flex items-center justify-center ${themeClasses.bg.overlay} transition-colors duration-500`}>
      <div className="container mx-auto p-4 max-w-2xl">
        <div className={`rounded-2xl p-8 md:p-12 text-center transition-colors duration-300 shadow-xl ${themeClasses.bg.card}`}>
          <div className="flex flex-col items-center gap-6">
            <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-indigo-700 to-blue-700' : 'bg-green-50'}`}>
              <FiShoppingCart size={64} className={darkMode ? 'text-white' : 'text-green-600'} />
            </div>

            <div className="space-y-3">
              <h2 className={`text-2xl md:text-3xl font-bold ${themeClasses.text.primary}`}>Your cart is empty</h2>
              <p className={`max-w-md mx-auto text-sm md:text-base ${themeClasses.text.secondary}`}>
                Looks like you haven't added any products yet. Browse our store to find great deals and add items to your cart.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link 
                to="/store" 
                className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg ${themeClasses.button.primary}`}
              >
                Browse Store
              </Link>
              <Link 
                to="/" 
                className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${themeClasses.button.outline}`}
              >
                <FiArrowLeft size={16} />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${themeClasses.bg.overlay} transition-colors duration-500`}>
      <div className="container mx-auto px-3 py-6 max-w-6xl">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold ${themeClasses.text.accent} mb-2`}>
                Shopping Cart
              </h1>
              <p className={`text-sm ${themeClasses.text.secondary}`}>
                {productCount} product{productCount !== 1 ? 's' : ''} • {itemCount} item{itemCount !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link 
                to="/store" 
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${themeClasses.button.outline} hidden sm:block`}
              >
                Continue Shopping
              </Link>
              <button 
                onClick={handleClearCart} 
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${themeClasses.button.danger}`}
                aria-label="Clear entire cart"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className={`rounded-xl shadow-md overflow-hidden transition-all duration-300 ${themeClasses.bg.card}`}>
              <div className="p-4 sm:p-6">
                <div className={`divide-y ${themeClasses.divide}`}>
                  {items.map((item, index) => {
                    if (!item.product) return null;
                    
                    const productId = item.product._id || `fallback-${index}`;
                    const key = item._id || productId;
                    const productImage = item.product.image || item.product.thumbnail || 
                      (Array.isArray(item.product.images) && item.product.images.length > 0 ? 
                       item.product.images[0] : '/placeholder-image.webp');
                    const productTitle = item.product.title || 'Untitled Product';
                    const isUpdating = updatingItems[item._id];
                    const isDisabled = isUpdating || removingLoading;

                    const minQty = item.product.minimumOrderQuantity && item.product.minimumOrderQuantity > 0 ? 
                      item.product.minimumOrderQuantity : 1;
                    const stock = typeof item.product.quantity === 'number' ? item.product.quantity : 0;
                    const appMax = 10;
                    const maxAllowed = Math.min(stock > 0 ? stock : appMax, appMax);

                    return (
                      <div 
                        key={key} 
                        className={`py-4 flex flex-col sm:flex-row items-start gap-4 group transition-all duration-200 hover:${darkMode ? 'bg-gray-750' : 'bg-gray-50'} rounded-lg -mx-2 px-2`}
                        aria-label={`Cart item: ${productTitle}`}
                      >
                        <Link 
                          to={`/product/${productId}`} 
                          className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 relative rounded-lg overflow-hidden"
                        >
                          <ImageWithFallback 
                            src={productImage} 
                            alt={productTitle} 
                            className="w-full h-full object-cover rounded-lg"
                          />
                          {item.product.quantity <= 0 && (
                            <div className={`absolute inset-0 flex items-center justify-center rounded-lg ${darkMode ? 'bg-black/60' : 'bg-black/40'}`}>
                              <span className="text-white text-xs font-bold px-2 py-1 rounded">Out of Stock</span>
                            </div>
                          )}
                        </Link>

                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <Link 
                                to={`/product/${productId}`} 
                                className={`block font-semibold text-base hover:${themeClasses.text.accent} transition-colors line-clamp-2 ${themeClasses.text.primary}`}
                              >
                                {productTitle}
                              </Link>
                              {item.product.description && (
                                <p className={`text-sm mt-1 hidden sm:block ${themeClasses.text.secondary} line-clamp-2`}>
                                  {item.product.description}
                                </p>
                              )}
                            </div>
                            <p className={`font-bold text-lg whitespace-nowrap ${themeClasses.text.accent}`}>
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>

                          <div className={`flex flex-wrap items-center gap-3 text-sm ${themeClasses.text.secondary}`}>
                            <div>
                              <span className="font-medium">${item.price.toFixed(2)}</span>
                              <span className="mx-1">×</span>
                              <span className="font-medium">{item.quantity}</span>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              item.product.quantity > 0 ? 
                                (darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800') : 
                                (darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800')
                            }`}>
                              {item.product.quantity > 0 ? `In stock: ${item.product.quantity}` : 'Out of stock'}
                            </div>
                          </div>

                          {stock <= 0 ? (
                            <p className={`text-sm ${themeClasses.text.danger}`}>This product is currently unavailable</p>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const newQ = item.quantity - 1;
                                    if (newQ < minQty) {
                                      showInlineAlert(item._id, `Minimum is ${minQty}`);
                                      return;
                                    }
                                    handleUpdateQuantity(item._id, newQ);
                                  }}
                                  disabled={item.quantity <= minQty || isDisabled}
                                  className={`p-2 rounded-lg transition-all duration-200 ${themeClasses.button.neutral} ${
                                    item.quantity <= minQty || isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                                  }`}
                                  aria-label={`Decrease quantity of ${productTitle}`}
                                >
                                  <FiMinus size={16} />
                                </button>

                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min={minQty}
                                    max={maxAllowed}
                                    value={item.quantity}
                                    disabled={isDisabled}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      if (isNaN(val)) return;
                                      if (val < minQty) {
                                        showInlineAlert(item._id, `Minimum is ${minQty}`);
                                        return;
                                      }
                                      if (val > maxAllowed) {
                                        showInlineAlert(item._id, `Maximum is ${maxAllowed}`);
                                        return;
                                      }
                                      handleUpdateQuantity(item._id, val);
                                    }}
                                    className={`w-16 text-center border rounded-lg px-2 py-2 ${themeClasses.input} transition-colors`}
                                    aria-label={`Quantity of ${productTitle}`}
                                  />
                                  {isUpdating && (
                                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                  )}
                                </div>

                                <button
                                  onClick={() => {
                                    const newQ = item.quantity + 1;
                                    if (newQ > maxAllowed) {
                                      showInlineAlert(item._id, `Maximum is ${maxAllowed}`);
                                      return;
                                    }
                                    handleUpdateQuantity(item._id, newQ);
                                  }}
                                  disabled={isDisabled || item.quantity >= maxAllowed}
                                  className={`p-2 rounded-lg transition-all duration-200 ${themeClasses.button.neutral} ${
                                    isDisabled || item.quantity >= maxAllowed ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                                  }`}
                                  aria-label={`Increase quantity of ${productTitle}`}
                                >
                                  <FiPlus size={16} />
                                </button>
                              </div>

                              {minQty > 1 && (
                                <span className={`text-xs px-2 py-1 rounded-md ${
                                  darkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  Min: {minQty}
                                </span>
                              )}
                            </div>
                          )}

                          {alerts[item._id] && (
                            <div className={`text-sm ${
                              alerts[item._id].type === 'error' ? themeClasses.text.danger : themeClasses.text.warning
                            }`} role="status">
                              {alerts[item._id].text}
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => handleRemoveItem(item._id, productTitle)} 
                          disabled={isDisabled}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                            darkMode ? 
                              'text-red-300 hover:bg-red-900/30 hover:text-red-200' : 
                              'text-red-600 hover:bg-red-50 hover:text-red-700'
                          }`}
                          aria-label={`Remove ${productTitle} from cart`}
                        >
                          <FiTrash2 size={16} />
                          <span className="text-sm font-medium hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className={`p-6 rounded-xl shadow-md transition-all duration-300 ${themeClasses.bg.card} sticky top-6`}>
              <h2 className={`text-xl font-bold mb-6 ${themeClasses.text.accent}`}>Order Summary</h2>
              
              <div className="space-y-4">
                <div className="max-h-48 overflow-auto space-y-2">
                  {items.filter(i => i.product).map(i => (
                    <div key={i._id} className={`flex justify-between text-sm ${themeClasses.text.secondary}`}>
                      <div className="truncate pr-3 flex-1">
                        <span className="font-medium">{i.quantity}×</span> {i.product?.title || 'Item'}
                      </div>
                      <div className="flex-shrink-0 font-medium">
                        ${(i.price * i.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`border-t ${themeClasses.border} pt-4 space-y-3`}>
                  <div className="flex justify-between items-center">
                    <span className={themeClasses.text.secondary}>Items:</span>
                    <span className={themeClasses.text.primary}>{itemCount}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={themeClasses.text.secondary}>Subtotal:</span>
                    <span className={themeClasses.text.primary}>${calculatedTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={themeClasses.text.secondary}>Shipping:</span>
                    <span className={themeClasses.text.accent}>Free</span>
                  </div>

                  <div className={`border-t ${themeClasses.border} pt-3 flex justify-between items-center text-lg font-bold`}>
                    <span className={themeClasses.text.primary}>Total:</span>
                    <span className={themeClasses.text.accent}>${calculatedTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Link 
                    to="/checkout" 
                    className={`block w-full py-3 text-center rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg ${themeClasses.button.primary}`}
                  >
                    Proceed to Checkout
                  </Link>
                  
                  <Link 
                    to="/store" 
                    className={`block w-full text-center py-2 rounded-lg transition-colors font-medium sm:hidden ${themeClasses.button.outline}`}
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;