import React, { useState, useEffect, useCallback, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FiShoppingCart, FiHeart } from "react-icons/fi";
import { FaHeart, FaRegStar, FaStarHalfAlt, FaStar } from "react-icons/fa";
import { toast } from 'react-toastify';
import api, { setAuthToken } from "../../../utils/api";
import { updateCartStatus, fetchCart } from "../../../redux/cart.slice";
import { isBuyer as isBuyerRole } from '../../../utils/role';
import { incrementWishlistCount, decrementWishlistCount, fetchWishlistCount, setWishlistStatus } from "../../../redux/wishlist.slice";

const ProductImage = memo(({ product, hovered, onLoad, onError }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const handleError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
    onError();
  }, [onError]);
  
  const handleLoad = useCallback(() => {
    setImageError(false);
    setImageLoaded(true);
    onLoad();
  }, [onLoad]);
  
  const imageUrl = product.image?.startsWith?.("http") 
    ? product.image 
    : `${product.image}`;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <img
        src={imageError ? "/placeholder-image.webp" : imageUrl}
        alt={product.title}
        className={`w-full h-full object-cover transition-all duration-700 ${
          imageLoaded ? (hovered ? "scale-110 rotate-1" : "scale-100") : "opacity-0"
        }`}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
      />
      <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-500 ${
        hovered ? "opacity-100" : ""
      }`}></div>
    </div>
  );
});

const ProductBadges = memo(({ product }) => {
  return (
    <>
      {product.discountPercentage > 0 && (
        <span className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10 transform-gpu transition-all duration-300 hover:scale-105">
          {product.discountPercentage}% OFF
        </span>
      )}
      
      {(product.quantity <= 0) && (
        <span className="absolute bottom-3 left-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
          Out of Stock
        </span>
      )}
      
      {product.extraImages?.length > 0 && (
        <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
          {product.extraImages.slice(0, 2).map((img, idx) => (
            <div
              key={idx}
              className="w-7 h-7 border-2 border-white rounded-md overflow-hidden shadow-lg bg-white transform-gpu transition-transform duration-300 hover:scale-125"
            >
              <img
                src={img}
                alt={`Preview ${idx + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
});

const RatingStars = memo(({ rating }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(<FaStar key={i} className="text-amber-400 fill-current transform-gpu transition-all duration-300 hover:scale-125" />);
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(<FaStarHalfAlt key={i} className="text-amber-400 fill-current" />);
    } else {
      stars.push(<FaRegStar key={i} className="text-amber-400" />);
    }
  }
  
  return <>{stars}</>;
});

const ProductPrice = memo(({ product }) => {
  const darkMode = useSelector(state => state.theme.darkMode);
  const discountPrice = product.discountPercentage > 0 && product.originalPrice
    ? (product.originalPrice - (product.originalPrice * product.discountPercentage / 100)).toFixed(2)
    : null;

  const priceClass = darkMode ? 'text-green-300' : 'text-gray-900';
  const oldPriceClass = darkMode ? 'text-gray-400' : 'text-gray-500';
  const saveClass = darkMode ? 'bg-rose-900/40 text-rose-200' : 'bg-rose-100 text-rose-800';

  return (
    <div className="flex items-center gap-2 mb-1">
      {discountPrice ? (
        <>
          <span className={`text-xl font-bold ${priceClass}`}>
            ${discountPrice}
          </span>
          <span className={`text-xs line-through font-medium ${oldPriceClass}`}>
            ${Number(product.originalPrice).toFixed(2)}
          </span>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${saveClass}`}>
            Save ${(product.originalPrice - discountPrice).toFixed(2)}
          </span>
        </>
      ) : product.originalPrice ? (
        <span className={`text-xl font-bold ${priceClass}`}>
          ${Number(product.originalPrice).toFixed(2)}
        </span>
      ) : (
        <span className={`text-xl font-bold ${priceClass}`}>
          ${Number(product.price).toFixed(2)}
        </span>
      )}
    </div>
  );
});

const ProductActions = memo(({ 
  isAddedToCart, 
  showRemoveOption, 
  cartLoading, 
  productQuantity,
  onAddToCart,
  onRemoveFromCart,
  isWishlisted,
  onWishlistToggle
}) => {
  return (
    <div className="flex items-center justify-between mt-auto gap-2">
      <button
        onClick={isAddedToCart ? onRemoveFromCart : onAddToCart}
        disabled={productQuantity <= 0 || cartLoading}
        className={`flex-1 p-2 rounded-xl transition-all duration-300 relative group flex items-center justify-center shadow-lg overflow-hidden ${
          isAddedToCart
            ? showRemoveOption
              ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-xl"
              : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
            : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-xl"
        } ${cartLoading ? "opacity-80 cursor-not-allowed" : "hover:scale-105"} transform-gpu`}
        aria-label={
          isAddedToCart
            ? showRemoveOption
              ? "Remove from cart"
              : "Added to cart"
            : "Add to cart"
        }
      >
        {cartLoading && (
          <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
        )}
        
        <span className="absolute inset-0 scale-0 transition-all duration-500 group-hover:scale-105 group-hover:bg-white/20 rounded-xl"></span>
        
        {cartLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin z-10"></div>
        ) : isAddedToCart ? (
          showRemoveOption ? (
            <>
              <span className="font-bold text-lg mr-2 z-10">✕</span>
              <span className="font-semibold z-10">Remove</span>
            </>
          ) : (
            <>
              <span className="font-bold text-lg mr-2 z-10">✓</span>
              <span className="font-semibold z-10">Added</span>
            </>
          )
        ) : (
          <>
            <FiShoppingCart className="text-lg mr-2 z-10" />
            <span className="font-semibold z-10">Add to cart</span>
          </>
        )}
      </button>
      
      <button
        onClick={onWishlistToggle}
        className={`p-2.5 rounded-xl transition-all duration-300 shadow-lg transform-gpu ${
          isWishlisted
            ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white scale-110"
            : "bg-white text-gray-600 hover:bg-gray-50"
        } hover:scale-110`}
        title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        {isWishlisted ? (
          <FaHeart className="text-lg fill-current" />
        ) : (
          <FiHeart className="text-lg" />
        )}
      </button>
    </div>
  );
});

function ProductCard({ product }) {
  const { user, token, role } = useSelector((state) => state.auth);
  const darkMode = useSelector(state => state.theme.darkMode);
  const wishlistItems = useSelector(state => state.wishlist.wishlistItems || {});
  const [isWishlisted, setIsWishlisted] = useState(Boolean(wishlistItems[product._id]));
  const [checkingWishlist, setCheckingWishlist] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [localProduct, setLocalProduct] = useState(product);
  const dispatch = useDispatch();
  const p = localProduct || product;
  const { isInCart, items } = useSelector((state) => state.cart);
  const isAddedToCart = isInCart[p._id] || false;
  const showRemoveOption = hovered && isAddedToCart;
  const isBuyer = isBuyerRole(role || user || null);

  const getCartItemId = useCallback(() => {
    const cartItem = items.find(item => item.product?._id === p._id);
    return cartItem?._id;
  }, [items, p._id]);

  useEffect(() => {
    setIsWishlisted(Boolean(wishlistItems[p._id]));
  }, [wishlistItems, p._id]);

  const handleWishlistToggle = useCallback(async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
    if (!user) {
      toast.error("Please login to manage wishlist");
      return;
    }
    if (!isBuyer) {
      toast.error('Only buyer accounts can use wishlist.');
      return;
    }
    
    if (checkingWishlist) return;
    
  const previousState = isWishlisted;
  const newState = !previousState;
  setIsWishlisted(newState);
  dispatch(setWishlistStatus({ productId: p._id, status: newState }));
  if (newState) dispatch(incrementWishlistCount()); else dispatch(decrementWishlistCount());
    
    try {
      setAuthToken(token);
      if (previousState) {
        await api.delete(`/api/wishlist/${p._id}`);
      } else {
        await api.post(`/api/wishlist`, { productId: p._id });
      }
      dispatch(fetchWishlistCount());
    } catch (err) {
  setIsWishlisted(previousState);
  dispatch(setWishlistStatus({ productId: p._id, status: previousState }));
  if (previousState) dispatch(incrementWishlistCount());
  else dispatch(decrementWishlistCount());
      console.error("Wishlist error:", err);
      toast.error(err.response?.data?.message || "Failed to update wishlist");
    }
  }, [user, token, p._id, isWishlisted, checkingWishlist, dispatch]);

  const handleAddToCart = useCallback(async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
    if (!user) {
      toast.error("You must be logged in to add products to cart");
      return;
    }
    if (!isBuyer) {
      toast.error('Only buyer accounts can add products to the cart.');
      return;
    }
    
    const currentQuantity = (localProduct || product).quantity;
    if (currentQuantity <= 0) {
      toast.error("This product is out of stock");
      return;
    }
    
    setCartLoading(true);
    try {
  const qtyToAdd = (p.minimumOrderQuantity && p.minimumOrderQuantity > 0) ? p.minimumOrderQuantity : 1;
  dispatch(updateCartStatus({ productId: p._id, isInCart: true }));
  dispatch({ type: 'cart/addItemOptimistically', payload: { ...p, quantity: qtyToAdd } });
  setAuthToken(token);
  const response = await api.post(`/api/cart/add`, { productId: p._id, quantity: qtyToAdd });
      
      if (response.data?.success) {
        await dispatch(fetchCart());
      }
    } catch (err) {
  dispatch(updateCartStatus({ productId: p._id, isInCart: false }));
      console.error("Error adding to cart:", err);
      const errorMsg = err.response?.data?.error || "Failed to add to cart";
      
      if (err.response?.data?.available) {
        toast.error(`Only ${err.response.data.available} available in stock`);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setCartLoading(false);
    }
  }, [user, token, p, dispatch]);

  const handleRemoveFromCart = useCallback(async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
    if (!user) {
      toast.error("You must be logged in to remove products from cart");
      return;
    }
    if (!isBuyer) {
      toast.error('Only buyer accounts can modify the cart.');
      return;
    }
    
  const cartItemId = getCartItemId();
    if (!cartItemId) {
      toast.error("Product not found in cart");
      return;
    }
    
    setCartLoading(true);
    try {
    dispatch(updateCartStatus({ productId: p._id, isInCart: false }));
  setAuthToken(token);
  await api.delete(`/api/cart/remove/${cartItemId}`);
      await dispatch(fetchCart());
    } catch (err) {
      dispatch(updateCartStatus({ productId: p._id, isInCart: true }));
      console.error("Error removing product from cart:", err);
      toast.error(err.response?.data?.error || "Failed to remove from cart");
    } finally {
      setCartLoading(false);
    }
  }, [user, token, p._id, getCartItemId, dispatch]);


  useEffect(() => {
    let mounted = true;
    const needed = ['brand', 'category', 'description', 'quantity', 'extraImages', 'minimumOrderQuantity'];
    const missing = needed.some(k => typeof product[k] === 'undefined' || product[k] === null);
    if (!missing) {
      setLocalProduct(product);
      return;
    }

    async function fetchMissing() {
      try {
        const fields = needed.concat(['_id','title','price','discountPercentage','image','averageRating','reviewsCount']).join(',');
        const res = await api.get(`/api/products/${product._id}`, { params: { fields } });
        if (res.data && res.data.product) {
          if (!mounted) return;
          setLocalProduct(prev => ({ ...prev, ...res.data.product }));
        }
      } catch (err) {
        console.error('Failed to fetch product fields for card:', err?.response?.data || err.message || err);
      }
    }

      fetchMissing();
      return () => { mounted = false; };
    }, [product]);

    const averageRating = (localProduct || product).averageRating || 0;
    const reviewCount = (localProduct || product).reviewsCount || 0;

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  useEffect(() => {
    if (hovered) {
      setCardElevated(true);
    } else {
      const timer = setTimeout(() => setCardElevated(false), 300);
      return () => clearTimeout(timer);
    }
  }, [hovered]);

  const [cardElevated, setCardElevated] = useState(false);

  return (
    <Link
      to={`/product/${p._id}`}
      className="block"
      tabIndex={-1}
      style={{ textDecoration: "none" }}
    >
      <div
        className={`rounded-2xl transition-all duration-500 flex flex-col max-w-xs mx-auto relative overflow-hidden border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} ${cardElevated ? "shadow-2xl -translate-y-2" : "shadow-md hover:shadow-xl"}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ minHeight: 430 }}
            onClick={e => {
              if (
                e.target.closest("button") ||
                e.target.closest('[role="button"]')
              ) {
                e.preventDefault();
              }
            }}
      >
  <div className={`absolute inset-0 transition-opacity duration-500 ${hovered ? (darkMode ? 'bg-gradient-to-br from-gray-800/40 to-blue-900/40 opacity-100' : 'bg-gradient-to-br from-blue-50/30 to-purple-50/30 opacity-100') : 'opacity-0'}`}></div>
        
  <div className={`relative w-full aspect-square overflow-hidden ${darkMode ? 'bg-gradient-to-br from-gray-900 to-blue-900' : 'bg-gradient-to-br from-gray-50 to-gray-200'}` }>
          <div className={`w-full h-full transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <ProductImage 
              product={p} 
              hovered={hovered}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
          
          <ProductBadges product={p} />
        </div>
        
  <div className={`flex-1 flex flex-col px-4 py-3 relative z-10 ${darkMode ? 'text-gray-100' : ''}`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className={`font-bold text-base leading-tight line-clamp-2 transition-colors duration-300 ${darkMode ? 'text-blue-200 hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'}`}>
              {p.title}
            </h2>
            {reviewCount > 0 && (
              <span className={`flex items-center gap-1 font-bold text-xs px-2 py-1 rounded-full shadow-sm ml-2 transform-gpu transition-transform duration-300 hover:scale-105 ${darkMode ? 'bg-gray-800 border border-amber-700 text-amber-400' : 'bg-white/90 border border-amber-300 text-amber-500'}`}>
                <FaStar className="text-amber-400" />
                {averageRating}
              </span>
            )}
          </div>
          
          <ProductPrice product={p} />
          
          <div className="flex items-center gap-2 mb-2 text-xs flex-wrap">
            {p.brand && (
              <span className={`px-2 py-1 rounded-full font-medium transform-gpu transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700'}`}>{p.brand}</span>
            )}
            <span className={`px-2 py-1 rounded-full font-medium transform-gpu transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-50 text-purple-700'}`}>{p.category}</span>
            {(localProduct || product).quantity > 0 ? (
              <span className={`font-medium flex items-center ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                <span className={`w-2 h-2 rounded-full mr-1 animate-pulse ${darkMode ? 'bg-green-400' : 'bg-green-500'}`}></span>
                In Stock
              </span>
            ) : (
              <span className={`font-medium flex items-center ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                <span className={`w-2 h-2 rounded-full mr-1 ${darkMode ? 'bg-red-400' : 'bg-red-500'}`}></span>
                Out of Stock
              </span>
            )}
          </div>
          
          <div className="flex items-center mb-2">
            {reviewCount > 0 ? (
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  <RatingStars rating={averageRating} />
                </div>
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ({reviewCount})
                </span>
              </div>
            ) : (
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No reviews yet</span>
            )}
          </div>
          
            <p className={`text-xs mb-3 line-clamp-2 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {p.description}
          </p>
          
            <ProductActions
            isAddedToCart={isAddedToCart}
            showRemoveOption={showRemoveOption}
            cartLoading={cartLoading}
            productQuantity={p.quantity}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            isWishlisted={isWishlisted}
            onWishlistToggle={handleWishlistToggle}
            darkMode={darkMode}
          />
        </div>
        
        <div className={`absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-padding transition-all duration-700 ${
          hovered ? "opacity-30" : "opacity-0"
        }`} style={{ 
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '2px'
        }}></div>
      </div>
    </Link>
  );
}

export default memo(ProductCard);