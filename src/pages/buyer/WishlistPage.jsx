import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaHeart, FaTrash, FaShareAlt, FaExchangeAlt, FaShoppingCart, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import ProductComparisonModal from './ProductComparisonModal';
import EmptyState from './EmptyState';

const WishlistPage = () => {
    const { user, token } = useSelector((state) => state.auth);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchWishlist = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await axios.get(`/api/wishlist`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setWishlist(data.products || []);
            setSelectedProducts([]);
        } catch (err) {
            console.error('Failed to load wishlist:', err);
            setError(err.response?.data?.error || 'Failed to load wishlist');
            toast.error(err.response?.data?.error || 'Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    }, [token]);

    const handleRemoveFromWishlist = async (productId) => {
        try {
            await axios.delete(`/api/wishlist/${productId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchWishlist();
        } catch (err) {
            console.error('Failed to remove from wishlist:', err);
            toast.error(err.response?.data?.error || 'Failed to remove from wishlist');
        }
    };

    const handleBulkRemove = async () => {
        try {
            setBulkLoading(true);
            await Promise.all(
                selectedProducts.map(productId =>
                    axios.delete(`/api/wishlist/${productId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                )
            );
            toast.success(`${selectedProducts.length} items removed from wishlist`);
            fetchWishlist();
        } catch (err) {
            console.error('Failed to remove items:', err);
            toast.error('Failed to remove some items from wishlist');
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkAddToCart = async () => {
        if (!user) {
            toast.error('Please login to add items to cart');
            navigate('/login');
            return;
        }

        setBulkLoading(true);
        try {
            await Promise.all(
                selectedProducts.map(productId =>
                    axios.post(
                        `/api/cart`,
                        { productId, quantity: 1 },
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                )
            );
            toast.success(`${selectedProducts.length} items added to cart`);
            setSelectedProducts([]);
        } catch (err) {
            console.error('Failed to add items to cart:', err);
            toast.error('Failed to add some items to cart');
        } finally {
            setBulkLoading(false);
        }
    };

    const toggleProductSelection = (productId) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedProducts.length === wishlist.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(wishlist.map(item => item.product._id));
        }
    };

    useEffect(() => {
        if (user) fetchWishlist();
    }, [user, token, fetchWishlist]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="container mx-auto p-4 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={fetchWishlist}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
         <div className="container mx-auto p-4">
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100">
                    <FaArrowLeft />
                </button>
                <h1 className="text-2xl font-bold">Your Wishlist ({wishlist.length})</h1>
            </div>

            {wishlist.length === 0 ? (
                <EmptyState
                    icon={<FaHeart className="text-5xl text-gray-300" />}
                    title="Your wishlist is empty"
                    description="Start adding products to your wishlist to see them here"
                    action={
                        <Link to="/store" className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                            Browse Products
                        </Link>
                    }
                />
            ) : (
                <>
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={selectedProducts.length === wishlist.length && wishlist.length > 0}
                                onChange={toggleSelectAll}
                                className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 mr-2"
                            />
                            <span className="text-sm text-gray-600">
                                {selectedProducts.length} {selectedProducts.length === 1 ? 'item' : 'items'} selected
                            </span>
                        </div>

                        {selectedProducts.length > 0 && (
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setShowComparisonModal(true)}
                                    disabled={selectedProducts.length < 2 || selectedProducts.length > 4 || bulkLoading}
                                    className={`px-3 py-1 text-sm rounded flex items-center ${selectedProducts.length < 2 || selectedProducts.length > 4
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                        }`}
                                >
                                    <FaExchangeAlt className="mr-1" />
                                    Compare
                                </button>
                                <button
                                    onClick={handleBulkAddToCart}
                                    disabled={bulkLoading}
                                    className="px-3 py-1 text-sm rounded flex items-center bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-75"
                                >
                                    <FaShoppingCart className="mr-1" />
                                    {bulkLoading ? 'Adding...' : 'Add to Cart'}
                                </button>
                                <button
                                    onClick={handleBulkRemove}
                                    disabled={bulkLoading}
                                    className="px-3 py-1 text-sm rounded flex items-center bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-75"
                                >
                                    <FaTrash className="mr-1" />
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {wishlist.map((item) => (
                            <div
                                key={item.product._id}
                                className={`bg-white p-4 rounded-lg shadow hover:shadow-lg transition relative ${selectedProducts.includes(item.product._id) ? 'ring-2 ring-green-500' : ''
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedProducts.includes(item.product._id)}
                                    onChange={() => toggleProductSelection(item.product._id)}
                                    className="absolute top-2 left-2 h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <button
                                    onClick={() => handleRemoveFromWishlist(item.product._id)}
                                    className="absolute top-2 right-2 p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                                    title="Remove from wishlist"
                                >
                                    <FaTrash />
                                </button>
                                <Link to={`/product/${item.product._id}`} className="block">
                                    <img
                                        src={
                                            item.product.image?.startsWith('http')
                                                ? item.product.image
                                                : item.product.image?.includes('/uploads/')
                                                                    ? item.product.image
                : `/uploads/${item.product.image}`
                                        }
                                        alt={item.product.title}
                                        className="w-full h-48 object-contain mb-4"
                                        onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                                    />
                                    <h3 className="font-semibold text-lg mb-1 hover:text-green-600 line-clamp-1">
                                        {item.product.title}
                                    </h3>
                                    <div className="flex justify-between items-center">
                                        <p className="text-green-600 font-bold">${item.product.price?.toFixed(2)}</p>
                                        {item.product.originalPrice && (
                                            <p className="text-sm text-gray-500 line-through">${item.product.originalPrice.toFixed(2)}</p>
                                        )}
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {showComparisonModal && (
                <ProductComparisonModal
                    productIds={selectedProducts}
                    onClose={() => setShowComparisonModal(false)}
                />
            )}
        </div>
    );
};

export default WishlistPage;