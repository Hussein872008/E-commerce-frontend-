import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import api, { setAuthToken } from '../../utils/api';
import { Pagination } from "@mui/material";
import Swal from 'sweetalert2';
import { 
  FiSearch, FiFilter, FiArrowUp, FiArrowDown, FiGrid, FiList, 
  FiEye, FiEdit, FiTrash2, FiPlus, FiDownload, FiUpload, 
  FiRefreshCw, FiBox, FiTag, FiDollarSign, FiPieChart 
} from 'react-icons/fi';

export default function MyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const [highlightedProduct, setHighlightedProduct] = useState(null);
  const highlightTimeout = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [stockFilter, setStockFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const { token } = useSelector((state) => state.auth);
  const isDarkMode = useSelector((state) => state.theme.darkMode);
  const navigate = useNavigate();
  const location = useLocation();

  const productsPerPage = 8;

  useEffect(() => {
    if (highlightTimeout.current) {
      clearTimeout(highlightTimeout.current);
    }

    const highlightId = searchParams.get('highlight');
    
    if (highlightId && products.length > 0) {
      setHighlightedProduct(highlightId);
      
      const productIndex = products.findIndex(p => p._id === highlightId);
      if (productIndex !== -1) {
        setTimeout(() => {
          const element = document.getElementById(`product-${highlightId}`);
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }, 100);
        
        highlightTimeout.current = setTimeout(() => {
          setHighlightedProduct(null);
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('highlight');
          navigate(`?${newParams.toString()}`, { replace: true });
        }, 3000);
      }
    }

    return () => {
      if (highlightTimeout.current) {
        clearTimeout(highlightTimeout.current);
      }
    };
  }, [products, searchParams, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("Please login to view your products");
        setLoading(false);
        return;
      }

      const currentParams = {
        page: currentPage,
        limit: productsPerPage,
        search: searchTerm,
        category: selectedCategory,
        sortBy,
        sortOrder,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        stockFilter,
        statusFilter
      };

      const cacheKey = 'seller_my_products_cache';
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (raw && !forceRefresh) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.params && JSON.stringify(parsed.params) === JSON.stringify(currentParams)) {
            setProducts(parsed.products || []);
            setCategories(parsed.categories || []);
            setTotalPages(parsed.totalPages || 1);
            setStats(parsed.stats || { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Cache read failed', e);
      }

      try {
 const isFirstLoad = initialLoad && products.length === 0;
        if (isFirstLoad) setLoading(true);
        else setProductsLoading(true);
        
        setAuthToken(token);
        const [productsRes, categoriesRes] = await Promise.all([
          api.get(`/api/products/seller/my-products`, {
            params: {
              page: currentPage,
              limit: productsPerPage,
              search: searchTerm,
              category: selectedCategory,
              sortBy: sortBy,
              sortOrder: sortOrder,
              minPrice: priceRange.min,
              maxPrice: priceRange.max,
              stockFilter: stockFilter,
              statusFilter: statusFilter
            }
          }),
          api.get(`/api/products/categories`)
        ]);

        const productsData = productsRes.data?.products || [];
        const totalProducts = productsRes.data?.total || 0;
        
        let categoriesData = [];
        if (Array.isArray(categoriesRes.data)) {
          categoriesData = categoriesRes.data;
        } else if (categoriesRes.data && typeof categoriesRes.data === 'object') {
          categoriesData = Object.keys(categoriesRes.data);
        }

        setProducts(productsData.map(product => ({
          ...product,
          image: product.image?.startsWith('http') 
            ? product.image 
            : (() => {
                const img = product.image?.split('/').pop();
                const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';
                return img ? `${base}/uploads/${img}` : '/placeholder-image.webp';
              })()
        })));
        
        setTotalPages(Math.ceil(totalProducts / productsPerPage));
        setCategories(categoriesData);
        
        const inStockCount = productsData.filter(p => p.quantity > 5).length;
        const lowStockCount = productsData.filter(p => p.quantity > 0 && p.quantity <= 5).length;
        const outOfStockCount = productsData.filter(p => p.quantity === 0).length;
        
        setStats({
          total: totalProducts,
          inStock: inStockCount,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount
        });
        
        if (productsData.length === 0 && !categoriesData.length) {
          setError("");
        }

        try {
          const cachePayload = {
            params: currentParams,
            products: productsData.map(product => ({
              ...product,
              image: product.image?.startsWith('http') ? product.image : (() => {
                const img = product.image?.split('/').pop();
                const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';
                return img ? `${base}/uploads/${img}` : '/placeholder-image.webp';
              })()
            })),
            categories: categoriesData,
            totalPages: Math.ceil(totalProducts / productsPerPage),
            stats: {
              total: totalProducts,
              inStock: inStockCount,
              lowStock: lowStockCount,
              outOfStock: outOfStockCount
            },
            timestamp: Date.now()
          };
          sessionStorage.setItem(cacheKey, JSON.stringify(cachePayload));
        } catch (e) {
          console.warn('Cache save failed', e);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        if (err.response?.status !== 404) {
          setError(err.response?.data?.error || "Failed to load data");
        }
        setProducts([]);
        setCategories([]);
      } finally {
        if (initialLoad) setInitialLoad(false);
        setLoading(false);
        setProductsLoading(false);
        if (forceRefresh) setForceRefresh(false);
      }
    };

    fetchData();
  }, [token, currentPage, searchTerm, selectedCategory, sortBy, sortOrder, priceRange, stockFilter, statusFilter, forceRefresh]);

  const handleDelete = async (productId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#EF4444',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: isDarkMode ? '#1F2937' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#000000',
      customClass: {
        popup: isDarkMode ? 'dark-mode-popup' : ''
      }
    });

    if (result.isConfirmed) {
      try {
        setAuthToken(token);
        await api.delete(`/api/products/${productId}`);
        setProducts(prevProducts => prevProducts.filter(p => p._id !== productId));
        
        setStats(prev => ({
          ...prev,
          total: prev.total - 1
        }));

        await Swal.fire({
          title: 'Deleted!',
          text: 'Your product has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#4F46E5',
          background: isDarkMode ? '#1F2937' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#000000',
          customClass: {
            popup: isDarkMode ? 'dark-mode-popup' : ''
          }
        });
      } catch (err) {
        await Swal.fire({
          title: 'Error!',
          text: err.response?.data?.error || "Failed to delete product",
          icon: 'error',
          confirmButtonColor: '#4F46E5',
          background: isDarkMode ? '#1F2937' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#000000',
          customClass: {
            popup: isDarkMode ? 'dark-mode-popup' : ''
          }
        });
        setError(err.response?.data?.error || "Failed to delete product");
      }
    }
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setPriceRange({ min: "", max: "" });
    setStockFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { status: "outOfStock", color: "red", text: "Out of Stock", bgColor: "bg-red-100", textColor: "text-red-800" };
    if (quantity <= 5) return { status: "lowStock", color: "yellow", text: "Low Stock", bgColor: "bg-yellow-100", textColor: "text-yellow-800" };
    return { status: "inStock", color: "green", text: "In Stock", bgColor: "bg-green-100", textColor: "text-green-800" };
  };

  if (loading) return (
    <div className={`flex justify-center items-center h-96 ${isDarkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto mb-4"></div>
        <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>Loading your products...</p>
      </div>
    </div>
  );

  return (
    <div className={`container mx-auto px-4 py-8 pb-32 transition-colors duration-500 ${isDarkMode ? 'text-gray-100 bg-gradient-to-br from-gray-900 via-blue-950 to-purple-950' : ''}`}>
      {/* Enhanced Header with Stats */}
  <div className={`p-6 rounded-2xl mb-8 transition-all ${isDarkMode ? 'bg-gray-800/60 border border-gray-700/30 shadow-lg' : 'bg-gradient-to-br from-white/80 to-indigo-50 border border-indigo-100/30 shadow-[0_8px_30px_rgb(0,0,0,0.06)]'}`}> 
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              My Products
            </h1>
            <p className={`mb-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage your product inventory and listings</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/seller/add-product")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 
            rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2
            shadow-md hover:shadow-indigo-200"
            >
              <FiPlus className="w-4 h-4" />
              Add New Product
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className={`p-4 rounded-xl transition-shadow ${isDarkMode ? 'bg-gray-800/60 border border-gray-700/30 shadow-lg' : 'bg-white'} `}>
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                <FiBox className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-sm text-gray-500'}`}>Total Products</p>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl transition-shadow ${isDarkMode ? 'bg-gray-800/60 border border-gray-700/30 shadow-lg' : 'bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md'}`}>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <FiPieChart className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-sm text-gray-500'}`}>In Stock</p>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{stats.inStock}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl transition-shadow ${isDarkMode ? 'bg-gray-800/60 border border-gray-700/30 shadow-lg' : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'}`}>
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <FiTag className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-sm text-gray-500'}`}>Low Stock</p>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{stats.lowStock}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl transition-shadow ${isDarkMode ? 'bg-gray-800/60 border border-gray-700/30 shadow-lg' : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'}`}>
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <FiDollarSign className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-sm text-gray-500'}`}>Out of Stock</p>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{stats.outOfStock}</p>
              </div>
            </div>
          </div>
        </div>

  {/* Enhanced Search and Filters */}
  <div className={`mt-6 space-y-4 ${isDarkMode ? '' : ''}`}>
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-gray-800/60 border-gray-700/30 text-gray-100 placeholder-gray-500 focus:border-indigo-500' 
                    : 'bg-white border-gray-200 focus:border-indigo-400'
                } focus:ring-2 focus:ring-indigo-200 transition-all duration-300`}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl border transition-all duration-300 flex items-center gap-2 ${
                  isDarkMode
                    ? (showFilters 
                        ? 'bg-indigo-900/30 border-indigo-700/50 text-indigo-300' 
                        : 'bg-gray-800/60 border-gray-700/30 text-gray-300 hover:bg-gray-700/50')
                    : (showFilters 
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')
                }`}
              >
                <FiFilter className="w-4 h-4" />
                Filters
              </button>
              
              <div className={`flex border rounded-xl overflow-hidden ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-3 transition-colors ${
                    isDarkMode
                      ? (viewMode === "grid" 
                          ? "bg-indigo-900/50 text-indigo-300" 
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700")
                      : (viewMode === "grid" 
                          ? "bg-indigo-100 text-indigo-700" 
                          : "bg-white text-gray-600 hover:bg-gray-50")
                  }`}
                >
                  <FiGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-3 transition-colors ${
                    isDarkMode
                      ? (viewMode === "list" 
                          ? "bg-indigo-900/50 text-indigo-300" 
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700")
                      : (viewMode === "list" 
                          ? "bg-indigo-100 text-indigo-700" 
                          : "bg-white text-gray-600 hover:bg-gray-50")
                  }`}
                >
                  <FiList className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  setForceRefresh(true);
                  setCurrentPage(1);
                  clearFilters();
                }}
                className={`px-4 py-3 rounded-xl border transition-colors flex items-center gap-2 ${
                  isDarkMode 
                    ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FiRefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className={`${isDarkMode ? 'bg-gray-800/60 border border-gray-700/30' : 'bg-white'} p-4 rounded-xl space-y-4 animate-fadeIn`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`w-full px-4 py-3 border rounded-xl transition-all duration-300 outline-none 
                    ${isDarkMode 
                      ? 'bg-gray-800/60 border-gray-700/50 text-gray-200 focus:border-indigo-500 focus:bg-gray-800/80' 
                      : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500 hover:border-indigo-300'
                    } focus:ring-2 focus:ring-indigo-500/20 shadow-sm hover:shadow-md`}
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price Range</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                        className={`w-full pl-8 pr-4 py-3 border rounded-xl transition-all duration-300 outline-none
                        ${isDarkMode 
                          ? 'bg-gray-800/60 border-gray-700/50 text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:bg-gray-800/80' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500 hover:border-indigo-300'
                        } focus:ring-2 focus:ring-indigo-500/20 shadow-sm hover:shadow-md`}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                        className={`w-full pl-8 pr-4 py-3 border rounded-xl transition-all duration-300 outline-none
                        ${isDarkMode 
                          ? 'bg-gray-800/60 border-gray-700/50 text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:bg-gray-800/80' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500 hover:border-indigo-300'
                        } focus:ring-2 focus:ring-indigo-500/20 shadow-sm hover:shadow-md`}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    </div>
                  </div>
                </div>

                {/* Stock Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Stock Status</label>
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl transition-all duration-300 outline-none
                    ${isDarkMode 
                      ? 'bg-gray-800/60 border-gray-700/50 text-gray-200 focus:border-indigo-500 focus:bg-gray-800/80' 
                      : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500 hover:border-indigo-300'
                    } focus:ring-2 focus:ring-indigo-500/20 shadow-sm hover:shadow-md`}
                  >
                    <option value="all">All Stock</option>
                    <option value="inStock">In Stock</option>
                    <option value="lowStock">Low Stock</option>
                    <option value="outOfStock">Out of Stock</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Sort By</label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className={`flex-1 px-4 py-3 border rounded-xl transition-all duration-300 outline-none
                      ${isDarkMode 
                        ? 'bg-gray-800/60 border-gray-700/50 text-gray-200 focus:border-indigo-500 focus:bg-gray-800/80' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500 hover:border-indigo-300'
                      } focus:ring-2 focus:ring-indigo-500/20 shadow-sm hover:shadow-md`}
                    >
                      <option value="createdAt">Date Created</option>
                      <option value="title">Name</option>
                      <option value="price">Price</option>
                      <option value="quantity">Stock</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className={`px-3 py-2 border rounded-r-lg transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {sortOrder === "asc" ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                >
                  <FiRefreshCw className="w-3 h-3" />
                  Clear all filters
                </button>
                <div className="text-sm text-gray-500">
                  {products.length} products found
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
            <div className={`p-4 mb-4 rounded-xl flex items-center ${isDarkMode ? 'text-red-300 bg-red-900/30 border border-red-700/30' : 'text-red-700 bg-red-100 border border-red-200'}`}>
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {products.length === 0 && !loading ? (
  <div className={`${isDarkMode ? 'bg-gray-800/50 border border-gray-700/30 text-gray-100' : 'bg-white'} text-center py-16 rounded-xl shadow-sm border` }>
          <div className="mx-auto w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <FiBox className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>No products found</h3>
          <p className={`mb-6 max-w-md mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>You don't have any products yet or your search didn't match any products.</p>
          <button
            onClick={() => navigate("/seller/add-product")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Add Your First Product
          </button>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`}>
              {productsLoading ? (
                Array.from({ length: productsPerPage }).map((_, idx) => (
                  <div key={`skeleton-${idx}`} className={`${isDarkMode ? 'bg-gray-800/60 border-gray-700/30' : 'bg-white border-gray-200'} rounded-2xl overflow-hidden shadow-sm border p-4 animate-pulse`}>
                    <div className={`h-44 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-4`} />
                    <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4 mb-2`} />
                    <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2 mb-4`} />
                    <div className="flex gap-2">
                      <div className={`flex-1 h-9 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`} />
                      <div className={`flex-1 h-9 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`} />
                    </div>
                  </div>
                ))
              ) : (
                products.map((product) => {
                const stockStatus = getStockStatus(product.quantity);
                return (
                  <div 
                    id={`product-${product._id}`}
                    key={product._id}
                    className={`product-card rounded-2xl overflow-hidden group relative ${
                      highlightedProduct === product._id 
                        ? 'product-highlighted' 
                        : 'hover:shadow-lg hover:scale-[1.02]'
                    } ${
                      isDarkMode 
                        ? 'bg-gray-800/60 border border-gray-700/30' 
                        : 'bg-white border border-gray-200'
                    }`}>
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = "/placeholder-image.webp";
                        }}
                      />
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${
                        stockStatus.color === 'red' ? 'bg-red-500 text-white' :
                        stockStatus.color === 'yellow' ? 'bg-yellow-500 text-white' :
                        'bg-green-500 text-white'
                      }`}>
                        {stockStatus.text}
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                    </div>
                      <div className="p-4">
                      <h2 className={`text-lg font-semibold mb-1 truncate ${isDarkMode ? 'text-gray-100' : ''}`}>{product.title}</h2>
                      <div className="flex justify-between items-center mb-2">
                        <p className={`font-bold text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>${product.price}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{product.quantity} in stock</p>
                      </div>
                      <p className={`text-sm mb-3 capitalize ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{product.category}</p>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/seller/edit-product/${product._id}`)}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-sm flex items-center justify-center transition-colors shadow-sm hover:shadow-md"
                        >
                          <FiEdit className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm flex items-center justify-center transition-colors shadow-sm hover:shadow-md"
                        >
                          <FiTrash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
                })
              )}
            </div>
          ) : (
            /* List View */
            <div className={`${isDarkMode ? 'bg-gray-800/60 border-gray-700/30' : 'bg-white border-gray-100'} rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border overflow-hidden`}>
              <div className="overflow-x-auto">
                {productsLoading ? (
                  <div className="p-6 space-y-4">
                    {Array.from({ length: Math.min(productsPerPage, 6) }).map((_, i) => (
                      <div key={`row-skel-${i}`} className="flex items-center gap-4 animate-pulse">
                        <div className="h-12 w-12 bg-gray-200 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-2/5" />
                          <div className="h-3 bg-gray-200 rounded w-1/3" />
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-20" />
                        <div className="h-4 bg-gray-200 rounded w-12" />
                        <div className="h-8 w-24 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                <table className="w-full">
                  <thead className={`${isDarkMode ? 'bg-gray-800/80' : 'bg-gray-50'}`}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Product
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Category
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Price
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Stock
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Status
                      </th>
                      <th className={`px-6 py-4 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${isDarkMode ? 'bg-gray-800/60' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {products.map((product) => {
                      const stockStatus = getStockStatus(product.quantity);
                      return (
                        <tr 
                          id={`product-${product._id}`}
                          key={product._id} 
                          className={`${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-indigo-50'} transition-all duration-700 ${
                            highlightedProduct === product._id 
                              ? `${isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-100/70'} shadow-[0_0_20px_rgba(99,102,241,0.3)] relative after:absolute after:inset-x-0 after:h-full after:top-0 after:bg-gradient-to-r after:from-indigo-500/10 after:via-transparent after:to-indigo-500/10` 
                              : ''
                          }`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12">
                                <img
                                  className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                                  src={product.image}
                                  alt={product.title}
                                  onError={(e) => { e.target.src = "/placeholder-image.webp"; }}
                                />
                              </div>
                              <div className="ml-4">
                                <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{product.title}</div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>SKU: {product.sku || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} capitalize`}>{product.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>${product.price}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{product.quantity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.bgColor} ${stockStatus.textColor}`}>
                              {stockStatus.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => navigate(`/seller/edit-product/${product._id}`)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors p-2 rounded-lg hover:bg-indigo-100"
                                title="Edit product"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product._id)}
                                className="text-red-600 hover:text-red-900 transition-colors p-2 rounded-lg hover:bg-red-100"
                                title="Delete product"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                )}
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: '10px',
                    margin: '0 4px',
                    '&:hover': {
                      backgroundColor: '#e0e7ff'
                    }
                  },
                  '& .Mui-selected': {
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#4338ca'
                    }
                  }
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Add custom animations */}
      <style>{`
        .product-card {
          transition: all 0.3s ease-in-out;
        }
        
        .product-highlighted {
          position: relative;
          transform: scale(1.05);
          z-index: 10;
          box-shadow: 0 0 0 4px rgb(99 102 241 / 50%), 0 4px 20px -2px rgb(99 102 241 / 25%);
        }

        @keyframes highlight-pulse {
          0% { box-shadow: 0 0 0 4px rgb(99 102 241 / 50%), 0 4px 20px -2px rgb(99 102 241 / 25%); }
          50% { box-shadow: 0 0 0 4px rgb(99 102 241 / 70%), 0 4px 30px -2px rgb(99 102 241 / 45%); }
          100% { box-shadow: 0 0 0 4px rgb(99 102 241 / 50%), 0 4px 20px -2px rgb(99 102 241 / 25%); }
        }

        .product-highlighted {
          animation: highlight-pulse 2s ease-in-out infinite;
        }

        html {
          scroll-behavior: smooth;
          scroll-padding-top: 100px;
        }

        .dark-mode-popup {
          border: 1px solid rgb(55 65 81 / 0.3) !important;
        }

        .dark-mode-popup .swal2-title,
        .dark-mode-popup .swal2-html-container {
          color: #fff !important;
        }

        .dark-mode-popup .swal2-icon {
          border-color: rgb(99 102 241 / 0.5) !important;
        }

        .dark-mode-popup .swal2-confirm {
          background-color: rgb(99 102 241) !important;
          color: white !important;
        }

        .dark-mode-popup .swal2-cancel {
          background-color: rgb(239 68 68) !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
}