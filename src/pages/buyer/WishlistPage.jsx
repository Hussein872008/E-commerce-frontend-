
import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaHeart, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import EmptyState from './EmptyState';
import ProductCard from './store/ProductCard';

const WishlistPage = () => {
    const { user, token } = useSelector((state) => state.auth);
    const darkMode = useSelector(state => state.theme.darkMode);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    // مقارنة المنتجات لم تعد مدعومة
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
            // setSelectedProducts([]); // removed: no longer needed
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

    // اختيار المنتجات لم يعد مدعوماً

    useEffect(() => {
        if (user) fetchWishlist();
    }, [user, token, fetchWishlist]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-blue-300' : 'border-green-600'}`}></div>
            </div>
        );
    }
    if (error) {
        return (
                <div className={`container mx-auto p-4 text-center ${darkMode ? 'bg-gray-900 text-blue-100' : 'bg-white text-gray-800'}`}> 
                    <p className={`mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
                    <button
                        onClick={fetchWishlist}
                        className={`px-4 py-2 rounded font-bold shadow transition-all ${darkMode ? 'bg-blue-800 text-blue-100 hover:bg-blue-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
                    >
                        Retry
                    </button>
                </div>
        );
    }

         return (
        <div className={`container mx-auto p-4 min-h-screen transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100' : 'bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 text-gray-800'}`}>
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className={`mr-4 p-2 rounded-full transition-all ${darkMode ? 'hover:bg-gray-800 text-blue-200' : 'hover:bg-gray-100 text-gray-700'}`}> 
                    <FaArrowLeft />
                </button>
                <h1 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${darkMode ? 'from-blue-200 via-blue-400 to-purple-400' : 'from-blue-700 via-indigo-700 to-purple-700'}`}>Your Wishlist ({wishlist.length})</h1>
            </div>

            {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center min-h-[60vh]">
                    <div className={`flex flex-col items-center justify-center`}>
                        <div className={`mb-6 p-6 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <FaHeart className={`text-6xl ${darkMode ? 'text-blue-400' : 'text-gray-400'}`} />
                        </div>
                        <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Your wishlist is empty</h2>
                        <p className={`mb-6 max-w-md ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Start adding products to your wishlist to see them here</p>
                        <Link 
                            to="/store" 
                            className={`px-6 py-3 rounded-lg font-semibold transition-all mt-2 ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-green-500 text-white hover:bg-green-600'}`}
                        >
                            Browse Products
                        </Link>
                    </div>
                </div>
            ) : (
                <>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {wishlist
                            .filter(item => item?.product)
                            .map((item) => (
                                <div key={item.product._id} className="relative group transition-all duration-200 hover:scale-[1.03]">
                                    {/* Remove from wishlist button overlays the card */}
                                    <button
                                        onClick={() => handleRemoveFromWishlist(item.product._id)}
                                        className={`absolute top-2 right-2 z-20 p-2 rounded-full transition-all ${darkMode ? 'text-red-300 hover:text-red-400 hover:bg-red-900' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                                        title="Remove from wishlist"
                                    >
                                        <FaTrash />
                                    </button>
                                    {/* Full product card */}
                                    <ProductCard product={item.product} />
                                </div>
                            ))}
                    </div>

                </>
            )}

            {/* تم حذف مودال المقارنة */}
            </div>
    );
};

export default WishlistPage;