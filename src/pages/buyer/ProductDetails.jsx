import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import api, { setAuthToken } from "../../utils/api";
import { toast } from "react-toastify";
import Swal from 'sweetalert2';
import { jwtDecode } from "jwt-decode";
import { useDispatch } from 'react-redux';
import { logout } from "../../redux/authSlice";
import { fetchRelatedProducts } from '../../redux/productSlice';
import {
    incrementWishlistCount,
    decrementWishlistCount,
} from '../../redux/wishlist.slice';
import { removeFromCart } from '../../redux/cart.slice';
import { fetchWishlistCount } from '../../redux/wishlist.slice';

import {
    FaShoppingCart,
    FaStar,
    FaArrowLeft,
    FaHeart,
    FaShare,
    FaInfoCircle,
    FaTag,
    FaBox,
    FaBalanceScale,
    FaShieldAlt as FaWarranty,
    FaBell,
    FaExpand,
    FaChevronLeft,
    FaChevronRight,
    FaEdit,
    FaTrash,
    FaTrashAlt,
    FaPlus,
    FaMinus
} from "react-icons/fa";
import { fetchCart, addItemOptimistically, updateCartStatus } from '../../redux/cart.slice';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user: currentUser, token } = useSelector((state) => state.auth);
    const { loading: productsLoading, relatedProducts } = useSelector((state) => state.products);
    const { isInCart, items } = useSelector((state) => state.cart);

    const decoded = token ? jwtDecode(token) : null;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mainImage, setMainImage] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState("description");
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [priceAlert, setPriceAlert] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [cartLoading, setCartLoading] = useState(false);
    const [showRemoveOption, setShowRemoveOption] = useState(false);
    const [qtyWarning, setQtyWarning] = useState("");


    useEffect(() => {
        setQtyWarning("");
    }, [product]);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [averageRatingData, setAverageRatingData] = useState({
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    });
    const [reviewForm, setReviewForm] = useState({
        rating: 0,
        comment: "",
        isSubmitting: false,
        hasReviewed: false,
        existingReviewId: null
    });
    const [editingReview, setEditingReview] = useState({
        id: null,
        rating: 0,
        comment: "",
        isEditing: false
    });
    const [imageLoading, setImageLoading] = useState(true);
    const [thumbnailsLoading, setThumbnailsLoading] = useState(true);

    const isAddedToCart = product ? isInCart[product._id] : false;

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (!decoded || !decoded.id) {
                    toast.error('Session invalid, please login again');
                    dispatch(logout());
                    return;
                }

                if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                    toast.info('Session expired, please login again');
                    dispatch(logout());
                }
            } catch (err) {
                console.error("Token validation error:", err);
                toast.error('Session error, please login again');
                dispatch(logout());
            }
        }
    }, [token, dispatch]);

    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);



    useEffect(() => {
        const fetchProductData = async () => {
            try {
                setLoading(true);
                if (!isValidObjectId(id)) {
                    setError("Invalid product ID");
                    return;
                }

                if (token) setAuthToken(token);
                const [productRes, reviewsRes, averageRes, cartRes] = await Promise.all([
                    api.get(`/api/products/${id}`),
                    api.get(`/api/reviews/product/${id}`),
                    api.get(`/api/reviews/average/${id}`),
                    token ? api.get('/api/cart') : Promise.resolve(null)
                ]);

                setProduct(productRes.data);
                setMainImage(productRes.data.image);
                setQuantity(productRes.data.minimumOrderQuantity && productRes.data.minimumOrderQuantity > 0 ? productRes.data.minimumOrderQuantity : 1);
                setReviews(reviewsRes.data?.reviews || []);
                setAverageRatingData({
                    average: averageRes.data.averageRating || 0,
                    count: averageRes.data.count || 0,
                    distribution: averageRes.data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                });

                if (cartRes?.data?.items) {
                    const inCart = cartRes.data.items.some(item => item.product._id === productRes.data._id);
                    dispatch(updateCartStatus({ productId: productRes.data._id, isInCart: inCart }));
                }

                await dispatch(fetchRelatedProducts(productRes.data.category));

                if (currentUser && token) {
                    await fetchWishlistStatus(id);
                }

            } catch (err) {
                console.error("Error loading product:", err);
                setError(err.response?.data?.message || "Failed to load product details");
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [id, token, currentUser, dispatch, navigate]);

    useEffect(() => {
        if (product?.category && product?._id) {
            dispatch(fetchRelatedProducts({
                category: product.category,
                excludeId: product._id
            }));
        }
    }, [dispatch, product?.category, product?._id]);

    const fetchWishlistStatus = async (productId) => {
        try {
            if (token) setAuthToken(token);
            const wishlistRes = await api.get(`/api/wishlist/check/${productId}`);
            setIsWishlisted(wishlistRes.data.isInWishlist);
        } catch (error) {
            console.warn("Could not check wishlist status:", error);
            if (error.response?.status === 403) {
                toast.error("You don't have permission to check wishlist");
            }
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === "reviews") {
            fetchProductReviews(id);
        }
    };

    const fetchAverageRating = async (productId) => {
        try {
            const response = await api.get(`/api/reviews/average/${productId}`);
            setAverageRatingData({
                average: response.data.averageRating || 0,
                count: response.data.count || 0,
                distribution: response.data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            });
        } catch (error) {
            console.error("Error fetching average rating:", error);
            toast.error("Failed to load rating information");
        }
    };

    const fetchProductReviews = async (productId) => {
        setReviewsLoading(true);
        try {
            if (token) setAuthToken(token);
            const response = await api.get(`/api/reviews/product/${productId}`, { withCredentials: true });

            const reviewsFromServer = response.data.reviews || [];
            setReviews(reviewsFromServer);

            if (currentUser) {
                const userReview = reviewsFromServer.find(r => r.isOwner === true);
                setReviewForm(prev => ({
                    ...prev,
                    hasReviewed: Boolean(userReview),
                    existingReviewId: userReview?._id || null,
                    rating: userReview?.rating || 0,
                    comment: userReview?.comment || ""
                }));
            }
        } catch (error) {
            console.error("Error loading reviews:", error);
            toast.error("Failed to load product reviews. Please try again.");
        } finally {
            setReviewsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            if (currentUser) {
                fetchProductReviews(id);
            } else {
                api.get(`/api/reviews/product/${id}`, { withCredentials: true })
                    .then(res => setReviews(res.data.reviews || []))
                    .catch(err => console.error("Error loading public reviews:", err));
            }
        }
    }, [id, currentUser]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser || !token) {
            toast.error("You need to login to write a review.");
            navigate('/login', { state: { from: `/product/${id}` } });
            return;
        }

        if (!reviewForm.rating) {
            toast.error("Please select a star rating before submitting.");
            return;
        }

        const trimmedComment = reviewForm.comment.trim();
        if (trimmedComment.length < 10) {
            toast.error(`Your review must be at least 10 characters long (currently ${trimmedComment.length}).`);
            return;
        }

        try {
            setReviewForm(prev => ({ ...prev, isSubmitting: true }));

            const reviewData = {
                productId: id,
                rating: reviewForm.rating,
                comment: trimmedComment,
            };

            let response;
            try {
                if (token) setAuthToken(token);
            } catch (e) {
                console.warn('Failed to set auth token before submitting review', e);
            }

            if (reviewForm.hasReviewed && reviewForm.existingReviewId) {
                response = await api.put(`/api/reviews/${reviewForm.existingReviewId}`, reviewData, { headers: { "Content-Type": "application/json" } });
                toast.success("Review updated successfully!");
            } else {
                response = await api.post(`/api/reviews`, reviewData, { headers: { "Content-Type": "application/json" } });
                toast.success("Review added successfully!");

                setReviewForm(prev => ({
                    ...prev,
                    hasReviewed: true,
                    existingReviewId: response.data.review._id,
                    rating: response.data.review.rating,
                    comment: response.data.review.comment
                }));

                setReviews(prev => [{
                    ...response.data.review,
                    isOwner: true,
                    user: {
                        _id: currentUser.id || currentUser._id,
                        username: currentUser.username
                    }
                }, ...prev]);
            }

            await Promise.all([
                fetchProductReviews(id),
                fetchAverageRating(id)
            ]);

        } catch (error) {
            console.error("Review submission error:", error);
            if (error.response?.status === 409) {
                const { reviewId } = error.response.data;
                setReviewForm(prev => ({
                    ...prev,
                    hasReviewed: true,
                    existingReviewId: reviewId
                }));
                toast.info("You've already reviewed this product. Editing your existing review.");
            } else {
                toast.error(error.response?.data?.message || "Failed to submit review");
            }
        } finally {
            setReviewForm(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    const handleStartEdit = (review) => {
        if (!review?._id) {
            toast.error("Invalid review data - missing ID");
            return;
        }

        if (reviewForm.existingReviewId === review._id) {
            setReviewForm(prev => ({
                ...prev,
                rating: review.rating,
                comment: review.comment
            }));
        }

        setEditingReview({
            id: review._id,
            rating: review.rating,
            comment: review.comment,
            isEditing: true
        });
    };

    const handleCancelEdit = () => {
        if (reviewForm.existingReviewId === editingReview.id) {
            const originalReview = reviews.find(r => r._id === editingReview.id);
            if (originalReview) {
                setReviewForm(prev => ({
                    ...prev,
                    rating: originalReview.rating,
                    comment: originalReview.comment
                }));
            }
        }

        setEditingReview({
            id: null,
            rating: 0,
            comment: "",
            isEditing: false
        });
    };

    const handleSaveEdit = async () => {
        if (!editingReview.id) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Review ID is missing. Cannot update.',
            });
            return;
        }

        try {
            setReviewForm(prev => ({ ...prev, isSubmitting: true }));

            if (token) setAuthToken(token);
            const response = await api.put(
                `/api/reviews/${editingReview.id}`,
                {
                    rating: editingReview.rating,
                    comment: editingReview.comment.trim()
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            await Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Review updated successfully!',
                showConfirmButton: false,
                timer: 2000
            });

            setReviews(reviews.map(r =>
                r._id === editingReview.id ? {
                    ...r,
                    rating: editingReview.rating,
                    comment: editingReview.comment.trim(),
                    updatedAt: new Date().toISOString()
                } : r
            ));

            if (reviewForm.existingReviewId === editingReview.id) {
                setReviewForm(prev => ({
                    ...prev,
                    rating: editingReview.rating,
                    comment: editingReview.comment.trim()
                }));
            }

            setEditingReview({
                id: null,
                rating: 0,
                comment: "",
                isEditing: false
            });

            await fetchAverageRating(id);

        } catch (error) {
            console.error("Error updating review:", error);

            let errorMessage = "Failed to update review";
            if (error.response) {
                if (error.response.status === 400) {
                    errorMessage = error.response.data.message || "Invalid review data";
                } else if (error.response.status === 401) {
                    errorMessage = "Session expired. Please login again.";
                    navigate('/login');
                } else if (error.response.status === 403) {
                    errorMessage = "You are not authorized to update this review";
                } else if (error.response.status === 404) {
                    errorMessage = "Review not found";
                }
            }

            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
            });
        } finally {
            setReviewForm(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!reviewId) {
            toast.error("Invalid review ID");
            return;
        }

        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel',
                allowOutsideClick: false
            });

            if (!result.isConfirmed) return;

            if (token) setAuthToken(token);
            const response = await api.delete(`/api/reviews/${reviewId}`);

            if (response.data.success) {
                await Swal.fire(
                    'Deleted!',
                    'Your review has been deleted.',
                    'success'
                );

                setReviews(reviews.filter(r => r._id !== reviewId));

                if (reviewForm.existingReviewId === reviewId) {
                    setReviewForm({
                        rating: 0,
                        comment: "",
                        isSubmitting: false,
                        hasReviewed: false,
                        existingReviewId: null
                    });
                }

                await fetchAverageRating(id);
            }
        } catch (error) {
            console.error("Delete review error:", error);

            let errorMessage = "Failed to delete review";
            if (error.response) {
                if (error.response.status === 403) {
                    errorMessage = "You are not authorized to delete this review";
                } else if (error.response.status === 404) {
                    errorMessage = "Review not found";
                }
            }

            await Swal.fire(
                'Error!',
                errorMessage,
                'error'
            );
        }
    };

    const handleAddToCart = async (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();

        if (!currentUser) {
            toast.error('You must be logged in to add products to cart');
            navigate('/login');
            return;
        }

        if (product.quantity <= 0) {
            toast.error('This product is out of stock');
            return;
        }

        setCartLoading(true);
        try {
            dispatch(addItemOptimistically({
                product,
                quantity
            }));

            const response = await api.post(
                `/api/cart/add`,
                { productId: product._id, quantity }
            );

            if (response.data.success) {
                setShowRemoveOption(true);
                await dispatch(fetchCart());
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
            const errorMsg = err.response?.data?.error || 'Failed to add to cart';

            if (err.response?.data?.available) {
                toast.error(`Only ${err.response.data.available} available in stock`);
            } else {
                toast.error(errorMsg);
            }
            await dispatch(fetchCart());
        } finally {
            setCartLoading(false);
        }
    };

    const handleRemoveFromCart = async () => {
        if (!product?._id) {
            toast.error("Product ID is missing");
            return;
        }

        if (!items || !Array.isArray(items)) {
            toast.error("Cart is empty or not loaded yet");
            return;
        }

        setCartLoading(true);
        try {
            const cartItem = items.find(item => item.product._id === product._id);
            if (!cartItem) {
                toast.error("Product not found in cart");
                return;
            }

            await dispatch(removeFromCart(cartItem._id)).unwrap();
            await dispatch(fetchCart());
        } catch (error) {
            console.error("Error removing from cart:", error);
            toast.error("Failed to remove product from cart");
        } finally {
            setCartLoading(false);
        }
    };

    const handleWishlistToggle = async () => {
        if (!currentUser) {
            toast.error("Please login to manage wishlist");
            navigate('/login');
            return;
        }

        try {
            setIsWishlisted(!isWishlisted);
            if (isWishlisted) {
                dispatch(decrementWishlistCount());
            } else {
                dispatch(incrementWishlistCount());
            }

            if (isWishlisted) {
                if (token) setAuthToken(token);
                await api.delete(`/api/wishlist/${product._id}`);
            } else {
                if (token) setAuthToken(token);
                await api.post(`/api/wishlist`, { productId: product._id });
            }

            dispatch(fetchWishlistCount());
        } catch (err) {
            setIsWishlisted(isWishlisted);
            if (isWishlisted) {
                dispatch(incrementWishlistCount());
            } else {
                dispatch(decrementWishlistCount());
            }

            console.error("Wishlist error:", err);
            toast.error(err.response?.data?.message || "Failed to update wishlist");
        }
    };

    const shareProduct = () => {
        if (navigator.share) {
            navigator.share({
                title: product.title,
                text: `Check out this product: ${product.title}`,
                url: window.location.href,
            }).catch(err => console.error('Error sharing:', err));
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard");
        }
    };

    const allImages = product ? [
        product.image,
        ...(product.extraImages || [])
    ].filter(img => img) : [];

    const openLightbox = (index) => {
        setCurrentSlide(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const goToPrevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    };

    const goToNextSlide = () => {
        setCurrentSlide((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    };

    const handleThumbnailClick = (img, index) => {
        setMainImage(img);
        setCurrentSlide(index);
    };

    const darkMode = useSelector(state => state.theme.darkMode);
    if (loading || productsLoading) {
        return (
            <div className={`container mx-auto px-4 py-8 max-w-7xl ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-blue-100' : ''}`}>
                <div className="mb-6">
                    <Skeleton height={30} width={150} baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                </div>
                <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-white'}`}> 
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/2 p-6">
                            <div className={`mb-4 h-96 flex items-center justify-center rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}> 
                                <Skeleton height={384} width="100%" baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                            </div>
                            <div className="grid grid-cols-4 gap-3 mt-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={`thumb-skeleton-${i}`} className="h-24">
                                        <Skeleton height={96} width="100%" baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 p-6">
                            <div className="flex justify-between mb-4">
                                <Skeleton width={100} height={24} baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                                <div className="flex space-x-2">
                                    <Skeleton circle width={32} height={32} baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                                    <Skeleton circle width={32} height={32} baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                                </div>
                            </div>
                            <Skeleton height={36} width="80%" className="mb-4" baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                            <Skeleton height={24} width="40%" className="mb-4" baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                            <Skeleton height={24} width="30%" className="mb-6" baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                            <div className="flex items-center mb-6 space-x-4">
                                <Skeleton height={40} width={120} baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                                <Skeleton height={40} width="100%" baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                {[...Array(4)].map((_, i) => (
                                    <div key={`spec-skeleton-${i}`} className={`flex items-center p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                        <Skeleton circle width={24} height={24} className="mr-2" baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                                        <div>
                                            <Skeleton width={80} height={16} className="mb-1" baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                                            <Skeleton width={120} height={16} baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mb-6">
                                <Skeleton height={24} width={120} className="mb-4" baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                                <Skeleton count={4} baseColor={darkMode ? '#222' : undefined} highlightColor={darkMode ? '#333' : undefined} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4 text-center text-red-600">
                {error}
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container mx-auto p-4 text-center">
                <p>Product not found</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className={`container mx-auto px-4 py-8 max-w-7xl relative ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-blue-100' : 'bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 text-gray-800'}`}>
            {lightboxOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors"
                    >
                        &times;
                    </button>
                    <button
                        onClick={goToPrevSlide}
                        className="absolute left-4 text-white text-2xl p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all"
                    >
                        <FaChevronLeft />
                    </button>

                    <div className="max-w-full max-h-full">
                        <img
                            src={allImages[currentSlide]}
                            alt={`Product ${currentSlide + 1}`}
                            className="max-w-full max-h-screen object-contain"
                        />
                    </div>

                    <button
                        onClick={goToNextSlide}
                        className="absolute right-4 text-white text-2xl p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all"
                    >
                        <FaChevronRight />
                    </button>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                        {allImages.map((_, index) => (
                            <button
                                key={`lightbox-indicator-${index}`}
                                onClick={() => setCurrentSlide(index)}
                                className={`w-3 h-3 rounded-full transition-all ${currentSlide === index ? 'bg-white' : 'bg-gray-500'}`}
                            />
                        ))}
                    </div>
                </div>
            )}


            <button
                onClick={() => navigate(-1)}
                className={`flex items-center mb-6 transition-colors font-bold ${darkMode ? 'text-blue-200 hover:text-blue-400' : 'text-blue-700 hover:text-blue-900'}`}
            >
                <FaArrowLeft className="mr-2" /> Back to Store
            </button>

            <div className={`rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-white'}`}> 
                <div className="flex flex-col lg:flex-row">
                    <div className="lg:w-1/2 p-6">
                        <div
                            className={`mb-4 h-96 flex items-center justify-center rounded-lg overflow-hidden relative group cursor-zoom-in transition-colors ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gray-50'}`}
                            onClick={() => openLightbox(currentSlide)}
                        >
                            {imageLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
                                </div>
                            )}
                            <img
                                src={mainImage}
                                alt={product.title}
                                className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                style={{ backgroundColor: 'transparent' }}
                                onLoad={() => setImageLoading(false)}
                                onError={(e) => {
                                    e.target.src = '/placeholder-image.webp';
                                    e.target.style.backgroundColor = 'transparent';
                                    setImageLoading(false);
                                }}
                            />
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <FaExpand />
                            </div>
                        </div>

                        {product.extraImages?.length > 0 && (
                            <div className="grid grid-cols-4 gap-3 mt-4">
                                <div
                                    className={`h-24 cursor-pointer rounded-md overflow-hidden relative transition-all flex items-center justify-center ${mainImage === product.image ? (darkMode ? 'ring-2 ring-green-400 scale-105' : 'border-green-500 scale-105') : (darkMode ? 'ring-0 hover:ring-1 hover:ring-blue-700' : 'border-transparent hover:border-gray-300')}`}
                                    onClick={() => handleThumbnailClick(product.image, 0)}
                                >
                                    {thumbnailsLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-600"></div>
                                        </div>
                                    )}
                                    <img
                                        src={product.image}
                                        alt="Main"
                                        className={`w-full h-full object-contain ${thumbnailsLoading ? 'opacity-0' : 'opacity-100'}`}
                                        style={{ backgroundColor: 'transparent' }}
                                        onLoad={() => setThumbnailsLoading(false)}
                                    />
                                </div>
                                {product.extraImages.map((img, index) => (
                                    <div
                                        key={`extra-img-${index}`}
                                        className={`h-24 cursor-pointer rounded-md overflow-hidden relative transition-all flex items-center justify-center ${mainImage === img ? (darkMode ? 'ring-2 ring-green-400 scale-105' : 'border-green-500 scale-105') : (darkMode ? 'ring-0 hover:ring-1 hover:ring-blue-700' : 'border-transparent hover:border-gray-300')}`}
                                        onClick={() => handleThumbnailClick(img, index + 1)}
                                    >
                                        {thumbnailsLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-600"></div>
                                            </div>
                                        )}
                                        <img
                                            src={img}
                                            alt={`${product.title} ${index + 1}`}
                                            className={`w-full h-full object-contain ${thumbnailsLoading ? 'opacity-0' : 'opacity-100'}`}
                                            style={{ backgroundColor: 'transparent' }}
                                            onLoad={() => setThumbnailsLoading(false)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="lg:w-1/2 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`inline-block text-xs px-2 py-1 rounded-full transition-all font-bold ${darkMode ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                                {product.category}
                            </span>
                            <div className="flex space-x-2">
                                <motion.button
                                    onClick={handleWishlistToggle}
                                    className={`p-2 rounded-full transition-all focus:outline-none`}
                                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                                    aria-pressed={isWishlisted}
                                    whileTap={{ scale: 0.9 }}
                                    animate={{ scale: isWishlisted ? 1.12 : 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                                    style={{
                                        background: isWishlisted ? (darkMode ? 'rgba(236,72,153,0.12)' : 'rgba(255,228,230,0.9)') : 'transparent',
                                        color: isWishlisted ? 'rgb(236 72 153)' : (darkMode ? 'rgb(148 163 184)' : 'rgb(156 163 175)')
                                    }}
                                >
                                    <motion.span
                                        initial={{ scale: 1 }}
                                        animate={{ scale: isWishlisted ? [1, 1.25, 1] : 1 }}
                                        transition={{ duration: 0.45, times: [0, 0.5, 1], ease: 'easeOut' }}
                                        className="inline-flex items-center justify-center"
                                    >
                                        <FaHeart aria-hidden="true" />
                                    </motion.span>
                                </motion.button>

                                <button
                                    onClick={shareProduct}
                                    className="p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                    title="Share"
                                >
                                    <FaShare />
                                </button>
                            </div>
                        </div>

                        <h1 className={`text-3xl font-bold mb-2 transition-colors ${darkMode ? 'hover:text-blue-400 text-blue-100' : 'hover:text-blue-700 text-blue-900'}`}>{product.title}</h1>

                        {product.sku && (
                            <p className={`text-sm mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>SKU: {product.sku}</p>
                        )}

                        <div className="flex items-center mb-4">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <FaStar
                                        key={`rating-star-${i}`}
                                        className={`transition-colors ${i < Math.floor(averageRatingData.average) ? "fill-current" : darkMode ? 'fill-blue-900' : 'fill-gray-300'}`}
                                    />
                                ))}
                            </div>
                            <span className={`ml-2 ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                                {averageRatingData.average.toFixed(1)} ({averageRatingData.count} {averageRatingData.count === 1 ? 'review' : 'reviews'})
                            </span>
                        </div>

                        <div className="mb-4 flex items-center space-x-3">
                            {(product.discountPercentage && product.originalPrice) ? (
                                <>
                                    <span className={`text-sm line-through ${darkMode ? 'text-blue-900' : 'text-blue-400'}`}>
                                        ${product.originalPrice.toFixed(2)}
                                    </span>
                                    <span className={`text-2xl font-bold ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                                        ${(
                                            product.originalPrice - (product.originalPrice * product.discountPercentage / 100)
                                        ).toFixed(2)}
                                    </span>
                                    <span className={`text-sm px-2 py-1 rounded-full transition-all font-bold ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
                                        {Math.round(product.discountPercentage)}% OFF
                                    </span>
                                </>
                            ) : product.originalPrice ? (
                                <span className={`text-2xl font-bold ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                                    ${product.originalPrice.toFixed(2)}
                                </span>
                            ) : (
                                <span className={`text-2xl font-bold ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                                    ${product.price?.toFixed(2)}
                                </span>
                            )}
                        </div>

                        {product.meta?.createdAt && (
                            <div className={`text-xs mb-4 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                Listed on: {new Date(product.meta.createdAt).toLocaleDateString()}
                            </div>
                        )}

                        <div className="mb-6">
                            <p className={`font-medium ${product.quantity > 0 ? (darkMode ? 'text-blue-200' : 'text-blue-700') : 'text-red-600'}`}>
                                {product.quantity > 0
                                    ? `${product.quantity} available in stock`
                                    : "Out of stock"}
                            </p>
                        </div>

                        {(product.discountPercentage > 0 || product.warrantyInformation || product.returnPolicy || product.shippingInformation) && (
                            <div className={`p-4 rounded-lg mb-6 transition-all hover:bg-blue-100 ${darkMode ? 'bg-blue-900/60 hover:bg-blue-900/80' : 'bg-blue-50'}`}>
                                <h3 className={`font-semibold mb-2 ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>Why buy this product?</h3>
                                <ul className={`list-disc list-inside text-sm space-y-1 ${darkMode ? 'text-blue-100' : 'text-blue-700'}`}>
                                    {product.discountPercentage > 0 && (
                                        <li>Save {Math.round(product.discountPercentage)}% compared to original price</li>
                                    )}
                                    {product.warrantyInformation && (
                                        <li>Comes with {product.warrantyInformation} warranty</li>
                                    )}
                                    {product.returnPolicy && (
                                        <li>{product.returnPolicy} return policy</li>
                                    )}
                                    {product.shippingInformation && (
                                        <li>{product.shippingInformation}</li>
                                    )}
                                </ul>
                            </div>
                        )}
                        <div className="flex items-center mb-6 space-x-4">
                            <div className={`flex items-center border rounded-lg overflow-hidden transition-all ${darkMode ? 'border-blue-900 hover:border-blue-400' : 'hover:border-blue-400 border-blue-200'}`}>
                                <button
                                    className={`px-3 py-2 transition-colors flex items-center justify-center ${darkMode ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                                    onClick={() => {
                                        const minQty = product.minimumOrderQuantity || 1;
                                        const maxQty = Math.min(product.quantity, 10);
                                        if (quantity <= minQty) {
                                            setQtyWarning(`Minimum order quantity for this product is ${minQty}`);
                                            return;
                                        }
                                        setQtyWarning("");
                                        setQuantity(prev => prev - 1);
                                    }}
                                    disabled={quantity <= (product.minimumOrderQuantity || 1) || isAddedToCart}
                                    aria-label="Decrease quantity"
                                >
                                    <FaMinus />
                                </button>
                                <input
                                    type="number"
                                    min={product.minimumOrderQuantity || 1}
                                    max={Math.min(product.quantity, 10)}
                                    value={quantity}
                                    disabled={isAddedToCart}
                                    onChange={e => {
                                        const val = parseInt(e.target.value, 10);
                                        const minQty = product.minimumOrderQuantity || 1;
                                        const maxQty = Math.min(product.quantity, 10);
                                        if (isNaN(val)) return;
                                        if (val < minQty) {
                                            setQtyWarning(`Minimum order quantity for this product is ${minQty}`);
                                            setQuantity(val);
                                            return;
                                        }
                                        if (val > maxQty) {
                                            if (product.quantity < 10) {
                                                setQtyWarning(`Maximum available quantity for this product is ${product.quantity}`);
                                            } else {
                                                setQtyWarning('Maximum per order is 10');
                                            }
                                            setQuantity(val);
                                            return;
                                        }
                                        setQtyWarning("");
                                        setQuantity(val);
                                    }}
                                    className={`px-2 py-1 border-x text-center w-24 font-semibold text-lg select-none ${darkMode ? 'border-blue-800' : 'border-blue-200'} ${darkMode ? 'text-blue-100 bg-blue-950' : 'text-gray-900 bg-white'}`}
                                    aria-label="Quantity input"
                                />
                                <button
                                    className={`px-3 py-2 transition-colors flex items-center justify-center ${darkMode ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                                    onClick={() => {
                                        const maxQty = Math.min(product.quantity, 10);
                                        if (quantity >= maxQty) {
                                            if (product.quantity < 10) {
                                                setQtyWarning(`Maximum available quantity for this product is ${product.quantity}`);
                                            } else {
                                                setQtyWarning('Maximum per order is 10');
                                            }
                                            return;
                                        }
                                        setQtyWarning("");
                                        setQuantity(prev => prev + 1);
                                    }}
                                    disabled={quantity >= Math.min(product.quantity, 10) || isAddedToCart}
                                    aria-label="Increase quantity"
                                >
                                    <FaPlus />
                                </button>
                                {/* Inline warning message below quantity controls */}
                                <div className={`w-full min-h-[1.5em] mt-2 text-sm text-center transition-all duration-200 ${qtyWarning ? 'text-red-600' : 'text-transparent'}`} role="alert">
                                    {qtyWarning ? qtyWarning : '.'}
                                </div>
                            </div>

                            <button
                                onClick={isAddedToCart ? handleRemoveFromCart : handleAddToCart}
                                disabled={product.quantity <= 0 || cartLoading}
                                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-md text-white transition-all font-semibold ${product.quantity > 0
                                        ? isAddedToCart
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : darkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'
                                        : 'bg-gray-400 cursor-not-allowed'
                                    }`}
                                aria-label={isAddedToCart ? 'Remove from cart' : 'Add to cart'}
                            >
                                {cartLoading ? (
                                    <span className="flex items-center justify-center space-x-2">
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        <span>{isAddedToCart ? 'Removing...' : 'Adding...'}</span>
                                    </span>
                                ) : (
                                    <>
                                        {isAddedToCart ? <FaTrashAlt className="inline-block" /> : <FaShoppingCart className="inline-block" />}
                                        <span>{isAddedToCart ? 'Remove from Cart' : 'Add to Cart'}</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {product.brand && (
                                <div className={`flex items-center p-3 rounded-lg transition-all ${darkMode ? 'bg-blue-900/40 hover:bg-blue-900/60 text-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                    <FaTag className={`${darkMode ? 'text-green-300 mr-2' : 'text-green-600 mr-2'}`} />
                                    <div>
                                        <p className="text-sm font-medium">Brand</p>
                                        <p className={`${darkMode ? 'text-blue-100' : 'text-gray-600'} text-sm`}>{product.brand}</p>
                                    </div>
                                </div>
                            )}

                            {product.sku && (
                                <div className={`flex items-center p-3 rounded-lg transition-all ${darkMode ? 'bg-blue-900/40 hover:bg-blue-900/60 text-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                    <FaBox className={`${darkMode ? 'text-green-300 mr-2' : 'text-green-600 mr-2'}`} />
                                    <div>
                                        <p className="text-sm font-medium">SKU</p>
                                        <p className={`${darkMode ? 'text-blue-100' : 'text-gray-600'} text-sm`}>{product.sku}</p>
                                    </div>
                                </div>
                            )}

                            {product.weight && (
                                <div className={`flex items-center p-3 rounded-lg transition-all ${darkMode ? 'bg-blue-900/40 hover:bg-blue-900/60 text-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                    <FaBalanceScale className={`${darkMode ? 'text-green-300 mr-2' : 'text-green-600 mr-2'}`} />
                                    <div>
                                        <p className="text-sm font-medium">Weight</p>
                                        <p className={`${darkMode ? 'text-blue-100' : 'text-gray-600'} text-sm`}>{product.weight}g</p>
                                    </div>
                                </div>
                            )}

                            {product.dimensions && (
                                <div className={`flex items-center p-3 rounded-lg transition-all ${darkMode ? 'bg-blue-900/40 hover:bg-blue-900/60 text-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                    <FaBox className={`${darkMode ? 'text-green-300 mr-2' : 'text-green-600 mr-2'}`} />
                                    <div>
                                        <p className="text-sm font-medium">Dimensions</p>
                                        <p className={`${darkMode ? 'text-blue-100' : 'text-gray-600'} text-sm`}>{product.dimensions.width} × {product.dimensions.height} × {product.dimensions.depth} cm</p>
                                    </div>
                                </div>
                            )}

                            {product.warrantyInformation && (
                                <div className={`flex items-center p-3 rounded-lg transition-all ${darkMode ? 'bg-blue-900/40 hover:bg-blue-900/60 text-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                    <FaWarranty className={`${darkMode ? 'text-green-300 mr-2' : 'text-green-600 mr-2'}`} />
                                    <div>
                                        <p className="text-sm font-medium">Warranty</p>
                                        <p className={`${darkMode ? 'text-blue-100' : 'text-gray-600'} text-sm`}>{product.warrantyInformation}</p>
                                    </div>
                                </div>
                            )}

                            {product.minimumOrderQuantity && product.minimumOrderQuantity > 1 && (
                                <div className={`flex items-center p-3 rounded-lg transition-all ${darkMode ? 'bg-blue-900/40 hover:bg-blue-900/60 text-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                    <FaBox className={`${darkMode ? 'text-green-300 mr-2' : 'text-green-600 mr-2'}`} />
                                    <div>
                                        <p className="text-sm font-medium">Min Order</p>
                                        <p className={`${darkMode ? 'text-blue-100' : 'text-gray-600'} text-sm`}>{product.minimumOrderQuantity}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* تم تحسين ألوان التابات للوضوح في الدارك مود */}
                        <div className={`mb-6 border-b ${darkMode ? 'border-blue-900' : 'border-gray-200'}`}>
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => handleTabChange("description")}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                        ${activeTab === "description"
                                            ? darkMode ? 'border-green-400 text-green-300' : 'border-green-500 text-green-600'
                                            : darkMode ? 'border-transparent text-blue-300 hover:text-green-200 hover:border-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                >
                                    Description
                                </button>
                                <button
                                    onClick={() => handleTabChange("specifications")}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                        ${activeTab === "specifications"
                                            ? darkMode ? 'border-green-400 text-green-300' : 'border-green-500 text-green-600'
                                            : darkMode ? 'border-transparent text-blue-300 hover:text-green-200 hover:border-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                >
                                    Specifications
                                </button>
                                <button
                                    onClick={() => handleTabChange("reviews")}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                        ${activeTab === "reviews"
                                            ? darkMode ? 'border-green-400 text-green-300' : 'border-green-500 text-green-600'
                                            : darkMode ? 'border-transparent text-blue-300 hover:text-green-200 hover:border-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                >
                                    Reviews ({averageRatingData.count})
                                </button>
                            </nav>
                        </div>

                        {/* تم إضافة تأثيرات انتقال بين التابات باستخدام framer-motion */}
                        <div className="mb-6 min-h-[200px]">
                            <AnimatePresence mode="wait">
                                {activeTab === "description" && (
                                    <motion.div
                                        key="description"
                                        initial={{ opacity: 0, x: 40 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -40 }}
                                        transition={{ duration: 0.35, ease: "easeInOut" }}
                                    >
                                        <h3 className="font-semibold mb-2">Product Description</h3>
                                        <p className={`${darkMode ? 'text-blue-100' : 'text-gray-700'} whitespace-pre-line`}>{product.description}</p>
                                        {product.tags?.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-medium mb-2">Tags</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {product.tags.map(tag => (
                                                        <span key={`tag-${tag}`} className={`px-3 py-1 rounded-full text-sm transition-all hover:bg-blue-200 ${darkMode ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : 'bg-gray-100 text-gray-800'}`}>{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                                {activeTab === "specifications" && (
                                    <motion.div
                                        key="specifications"
                                        initial={{ opacity: 0, x: 40 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -40 }}
                                        transition={{ duration: 0.35, ease: "easeInOut" }}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h3 className="font-semibold mb-2">Product Details</h3>
                                                <ul className={`${darkMode ? 'text-blue-100' : 'text-gray-700'} space-y-2 text-sm`}>
                                                    {product.brand && <li><span className="font-medium">Brand:</span> {product.brand}</li>}
                                                    {product.sku && <li><span className="font-medium">SKU:</span> {product.sku}</li>}
                                                    {product.category && <li><span className="font-medium">Category:</span> {product.category}</li>}
                                                    {product.weight && <li><span className="font-medium">Weight:</span> {product.weight}g</li>}
                                                    {product.dimensions && (
                                                        <li>
                                                            <span className="font-medium">Dimensions:</span> {product.dimensions.width} × {product.dimensions.height} × {product.dimensions.depth} cm
                                                        </li>
                                                    )}
                                                    {product.meta?.barcode && <li><span className="font-medium">Barcode:</span> {product.meta.barcode}</li>}
                                                    {product.meta?.qrCode && <li><span className="font-medium">QR Code:</span> {product.meta.qrCode}</li>}
                                                </ul>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold mb-2">Shipping & Warranty</h3>
                                                <ul className={`${darkMode ? 'text-blue-100' : 'text-gray-700'} space-y-2 text-sm`}>
                                                    {product.shippingInformation && (
                                                        <li><span className="font-medium">Shipping:</span> {product.shippingInformation}</li>
                                                    )}
                                                    {product.availabilityStatus && (
                                                        <li><span className="font-medium">Availability:</span> {product.availabilityStatus}</li>
                                                    )}
                                                    {product.warrantyInformation && (
                                                        <li><span className="font-medium">Warranty:</span> {product.warrantyInformation}</li>
                                                    )}
                                                    {product.returnPolicy && (
                                                        <li><span className="font-medium">Return Policy:</span> {product.returnPolicy}</li>
                                                    )}
                                                    {product.minimumOrderQuantity && product.minimumOrderQuantity > 1 && (
                                                        <li><span className="font-medium">Min Order Qty:</span> {product.minimumOrderQuantity}</li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                {activeTab === "reviews" && (
                                    <motion.div
                                        key="reviews"
                                        initial={{ opacity: 0, x: 40 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -40 }}
                                        transition={{ duration: 0.35, ease: "easeInOut" }}
                                    >
                                       
                                        {(() => {
                                            return (
                                                <>
                                                    <div className="mb-6">
                                                        <h3 className="font-semibold mb-2">Customer Reviews</h3>
                                                        <div className="flex items-center mb-4">
                                                            <div className="text-4xl font-bold mr-4">
                                                                {averageRatingData.average.toFixed(1)}/5
                                                            </div>
                                                            <div className="flex-1">
                                                                {[5, 4, 3, 2, 1].map((rating) => (
                                                                    <div key={`rating-dist-${rating}`} className="flex items-center mb-1">
                                                                        <div className="w-10 text-right mr-2">
                                                                            {rating} <FaStar className="inline text-yellow-400" />
                                                                        </div>
                                                                        <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                                                            <div
                                                                                className="bg-yellow-400 h-2.5 rounded-full transition-all duration-500"
                                                                                style={{
                                                                                    width: `${averageRatingData.count > 0 ?
                                                                                        (averageRatingData.distribution[rating] / averageRatingData.count) * 100 : 0}%`
                                                                                }}
                                                                            ></div>
                                                                        </div>
                                                                        <div className="w-10 text-left ml-2 text-sm text-gray-600">
                                                                            {averageRatingData.distribution[rating]}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {currentUser && !reviewForm.hasReviewed && (
                                                        <div className={`mb-6 p-4 rounded-lg transition-all ${darkMode ? 'bg-blue-900/60 hover:bg-blue-900/80' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                                            <h4 className="font-medium mb-3">Add Your Review</h4>
                                                            <div className="flex items-center mb-3">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <FaStar
                                                                        key={`rating-star-${star}`}
                                                                        size={24}
                                                                        className={`cursor-pointer mx-1 transition-transform hover:scale-110 ${star <= reviewForm.rating ?
                                                                            "text-yellow-400" : darkMode ? 'text-blue-900' : "text-gray-300"
                                                                            }`}
                                                                        onClick={() => setReviewForm(prev => ({
                                                                            ...prev,
                                                                            rating: star
                                                                        }))}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <textarea
                                                                value={reviewForm.comment}
                                                                onChange={(e) => setReviewForm(prev => ({
                                                                    ...prev,
                                                                    comment: e.target.value
                                                                }))}
                                                                placeholder="Share your thoughts about this product..."
                                                                className={`w-full p-3 border rounded mb-3 transition-all focus:border-green-500 focus:ring-1 focus:ring-green-500 ${darkMode ? 'border-blue-900 bg-blue-950 text-blue-100' : 'border-gray-300'}`}
                                                                rows="4"
                                                            />
                                                            <button
                                                                onClick={handleReviewSubmit}
                                                                disabled={
                                                                    !reviewForm.rating ||
                                                                    reviewForm.comment.trim().length < 10 ||
                                                                    reviewForm.isSubmitting
                                                                }
                                                                className={`px-4 py-2 rounded-md text-white transition-all ${!reviewForm.rating || reviewForm.comment.trim().length < 10
                                                                    ? "bg-gray-400 cursor-not-allowed"
                                                                    : "bg-green-600 hover:bg-green-700"
                                                                    }`}
                                                            >
                                                                {reviewForm.isSubmitting ? (
                                                                    <span className="flex items-center justify-center">
                                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                        Processing...
                                                                    </span>
                                                                ) : "Submit Review"}
                                                            </button>
                                                            {reviewForm.comment.length > 0 && reviewForm.comment.length < 10 && (
                                                                <p className="text-red-500 text-sm mt-1">
                                                                    Review must be at least 10 characters
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {reviewsLoading ? (
                                                        <div className="space-y-4">
                                                            {[...Array(3)].map((_, i) => (
                                                                <div key={`review-skeleton-${i}`} className="border-b pb-4 mb-4">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <Skeleton width={150} height={20} />
                                                                        <Skeleton width={80} height={16} />
                                                                    </div>
                                                                    <div className="flex mb-2">
                                                                        <Skeleton width={80} height={16} />
                                                                    </div>
                                                                    <Skeleton count={2} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : reviews.length > 0 ? (
                                                        <div className="space-y-4">
                                                            {reviews.map((review) => {
                                                                if (!review._id) return null;
                                                                const isOwner = review.isOwner;
                                                                const isEditing = editingReview.isEditing && editingReview.id === review._id;
                                                                return (
                                                                    <div key={`review-${review._id}`} className="border-b pb-4 mb-4">
                                                                        {isEditing ? (
                                                                            <div className={`mt-3 p-4 rounded-lg ${darkMode ? 'bg-blue-900/60' : 'bg-gray-50'}`}>
                                                                                <div className="flex items-center mb-3">
                                                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                                                        <FaStar
                                                                                            key={`edit-star-${star}`}
                                                                                            size={24}
                                                                                            className={`cursor-pointer mx-1 transition-transform hover:scale-110 ${star <= editingReview.rating ? "text-yellow-400" : darkMode ? 'text-blue-900' : "text-gray-300"}`}
                                                                                            onClick={() => setEditingReview(prev => ({
                                                                                                ...prev,
                                                                                                rating: star
                                                                                            }))}
                                                                                        />
                                                                                    ))}
                                                                                </div>
                                                                                <textarea
                                                                                    value={editingReview.comment}
                                                                                    onChange={(e) => setEditingReview(prev => ({
                                                                                        ...prev,
                                                                                        comment: e.target.value
                                                                                    }))}
                                                                                    className={`w-full p-3 border rounded mb-3 transition-all focus:border-green-500 focus:ring-1 focus:ring-green-500 ${darkMode ? 'border-blue-900 bg-blue-950 text-blue-100' : 'border-gray-300'}`}
                                                                                    rows="4"
                                                                                />
                                                                                <div className="flex gap-2">
                                                                                    <button
                                                                                        onClick={handleSaveEdit}
                                                                                        disabled={editingReview.comment.trim().length < 10}
                                                                                        className={`px-4 py-2 rounded-md text-white transition-all ${editingReview.comment.trim().length < 10
                                                                                            ? "bg-gray-400 cursor-not-allowed"
                                                                                            : "bg-green-600 hover:bg-green-700"
                                                                                            }`}
                                                                                    >
                                                                                        Save Changes
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={handleCancelEdit}
                                                                                        className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-all"
                                                                                    >
                                                                                        Cancel
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <div className="flex justify-between items-start mb-2">
                                                                                    <div>
                                                                                        <h4 className={`${darkMode ? 'text-blue-100' : 'text-gray-800'} font-medium`}>
                                                                                            {review.user?.username || "Anonymous User"}
                                                                                            {isOwner && (
                                                                                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded transition-all">
                                                                                                    Your review
                                                                                                </span>
                                                                                            )}
                                                                                        </h4>
                                                                                        <div className="flex text-yellow-400 my-1">
                                                                                            {[...Array(5)].map((_, i) => (
                                                                                                <FaStar
                                                                                                    key={`review-star-${i}`}
                                                                                                    className={`${i < review.rating ? "fill-current" : darkMode ? 'fill-blue-900' : "fill-gray-300"}`}
                                                                                                    size={14}
                                                                                                />
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                    <span className={`${darkMode ? 'text-blue-300' : 'text-gray-500'} text-sm`}>
                                                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                                                        {review.updatedAt && review.updatedAt !== review.createdAt && (
                                                                                            <span className="block text-xs text-gray-400">(edited)</span>
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                                <p className={`${darkMode ? 'text-blue-100' : 'text-gray-700'} mb-3`}>{review.comment}</p>
                                                                                {isOwner && (
                                                                                    <div className="flex gap-3 mt-2">
                                                                                        <button
                                                                                            onClick={() => handleStartEdit(review)}
                                                                                            className="flex items-center text-blue-600 hover:text-blue-800 text-sm transition-colors"
                                                                                        >
                                                                                            <FaEdit className="mr-1" size={14} />
                                                                                            Edit
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleDeleteReview(review._id)}
                                                                                            className="flex items-center text-red-600 hover:text-red-800 text-sm transition-colors"
                                                                                        >
                                                                                            <FaTrash className="mr-1" size={14} />
                                                                                            Delete
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <FaStar className="mx-auto text-gray-300 text-4xl mb-2 transition-all" />
                                                            <p className={`${darkMode ? 'text-blue-300' : 'text-gray-500'}`}>No reviews yet</p>
                                                            {!currentUser && (
                                                                <p className="text-sm text-gray-400 mt-2">
                                                                    <button
                                                                        onClick={() => navigate("/login")}
                                                                        className="text-green-600 hover:underline transition-colors"
                                                                    >
                                                                        Login
                                                                    </button>{" "}
                                                                    to be the first to review
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related products removed as requested */}

        </div>
    );
}