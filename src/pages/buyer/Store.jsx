import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiSearch, FiFilter, FiLoader } from "react-icons/fi";
import api from "../../utils/api";
import { debounce } from 'lodash';
import { fetchAllProducts, fetchFilteredProducts, resetFilters } from "../../redux/productSlice";
import { fetchCart } from '../../redux/cart.slice';
import CategoryFilter from "./store/CategoryFilter";
import RatingFilter from "./store/RatingFilter";
import ProductSkeleton from "./store/ProductSkeleton";
import ProductCard from "./store/ProductCard";


// ----------------- Main Store component -----------------
export default function Store() {
  const dispatch = useDispatch();
  const { allProducts, filteredProducts, loading, error, isFiltered } = useSelector((state) => state.products);
  const isDarkMode = useSelector(state => state.theme.darkMode);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ 
    category: "", 
    minRating: 0, 
    sortBy: "-createdAt",
    minPrice: "",
    maxPrice: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // initial load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await dispatch(fetchAllProducts());
        await dispatch(fetchCart());
      } catch (err) {
        // handle error if needed
      }
      setDataLoaded(true);
    };
    loadInitialData();
  }, [dispatch]);


  // جلب التصنيفات
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/products/categories');
        setCategories(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // البحث المؤجل
  useEffect(() => {
    const debouncedSearch = debounce(() => setSearchTerm(searchInput.trim()), 500);
    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [searchInput]);

  // If the user clears the search box, immediately reset filters and fetch all products
  useEffect(() => {
    if (searchInput.trim() === "") {
      // keep searchTerm in sync
      setSearchTerm("");
      if (dataLoaded) {
        dispatch(resetFilters());
        dispatch(fetchAllProducts());
      }
    }
  }, [searchInput, dataLoaded, dispatch]);

  // تطبيق الفلاتر
  const applyFilters = useCallback(() => {
    if (!dataLoaded) return;
    const hasActiveFilters = Boolean(
      (searchTerm && searchTerm.length > 0) ||
      (filters.category && filters.category.length > 0) ||
      (filters.minRating && filters.minRating > 0) ||
      (filters.sortBy && filters.sortBy !== "-createdAt") ||
      (filters.minPrice && filters.minPrice > 0) ||
      (filters.maxPrice && filters.maxPrice > 0)
    );
    if (!hasActiveFilters) {
      dispatch(fetchAllProducts());
      return;
    }
    const params = {
      search: searchTerm || undefined,
      category: filters.category || undefined,
      minRating: filters.minRating || undefined,
      sortBy: filters.sortBy || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined
    };
    dispatch(fetchFilteredProducts(params));
  }, [dispatch, searchTerm, filters, dataLoaded]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const displayedProducts = useMemo(() => {
    const source = isFiltered ? filteredProducts : allProducts;
    return Array.isArray(source) ? source : [];
  }, [isFiltered, filteredProducts, allProducts]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setFilters({
      category: "",
      minRating: 0,
      sortBy: "-createdAt",
      minPrice: "",
      maxPrice: ""
    });
    dispatch(resetFilters());
    dispatch(fetchAllProducts());
  };

  const activeFilterCount = useMemo(() => {
    return [
      searchTerm ? 1 : 0,
      filters.category ? 1 : 0,
      filters.minRating > 0 ? 1 : 0,
      filters.sortBy !== "-createdAt" ? 1 : 0,
      filters.minPrice ? 1 : 0,
      filters.maxPrice ? 1 : 0
    ].reduce((a, b) => a + b, 0);
  }, [searchTerm, filters]);

  if (error && dataLoaded) {
    return (
      <div className={`p-6 max-w-7xl mx-auto ${isDarkMode ? 'text-gray-100' : ''}`}>
        <div className={`${isDarkMode ? 'bg-red-900/60 border-red-400' : 'bg-red-50 border-red-500'} border-l-4 p-4`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className={`h-5 w-5 ${isDarkMode ? 'text-red-300' : 'text-red-500'}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm ${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>{error}</p>
              <button 
                onClick={handleResetFilters} 
                className={`mt-2 text-sm font-medium transition-colors ${isDarkMode ? 'text-red-300 hover:text-red-100' : 'text-red-600 hover:text-red-500'}`}
              >
                Reset Filters →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 min-h-[80vh] max-w-7xl mx-auto rounded-2xl shadow-xl transition-colors duration-500
        ${isDarkMode
          ? 'bg-gradient-to-br from-gray-900 via-blue-950 to-purple-950 text-gray-100'
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-800'}
      `}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
          <span aria-hidden="true" className="hidden md:inline-block">Our Products</span>
        </h1>
        <div className="flex items-center w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search products..."
              className={`pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full transition-all
                ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-400' : ''}`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search products"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`ml-2 px-4 py-2 border rounded-lg flex items-center transition-colors relative
              ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100 hover:bg-gray-800' : 'bg-white hover:bg-gray-50'}`}
            aria-label="Toggle filters"
          >
            <FiFilter className="mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
      {showFilters && (
        <div className={`p-4 rounded-lg shadow-md mb-6 transition-all ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'}` }>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CategoryFilter 
              categories={categories} 
              selectedCategory={filters.category} 
              onChange={(v) => handleFilterChange("category", v)} 
            />
            <RatingFilter 
              value={filters.minRating} 
              onChange={(v) => handleFilterChange("minRating", v)} 
            />
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Sort By</label>
              <select 
                className={`w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500 transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
                value={filters.sortBy} 
                onChange={(e) => handleFilterChange("sortBy", e.target.value)} 
                aria-label="Sort products by"
              >
                <option value="-createdAt">Newest</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-rating">Highest Rating</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Min Price</label>
              <input
                type="number"
                min="0"
                className={`w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500 transition-all ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
                value={filters.minPrice}
                onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                placeholder="Min price"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Max Price</label>
              <input
                type="number"
                min="0"
                className={`w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500 transition-all ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                placeholder="Max price"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Reset All
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      <div className={`mb-4 flex justify-between items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {displayedProducts.length > 0 && (
          <span>Showing {displayedProducts.length} products</span>
        )}
        {isFiltered && (
          <button 
            onClick={handleResetFilters}
            className={`text-sm transition-colors ${isDarkMode ? 'text-green-300 hover:text-green-100' : 'text-green-600 hover:text-green-800'}`}
          >
            Clear all filters
          </button>
        )}
      </div>
      {!dataLoaded ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className={`text-center py-12 rounded-lg shadow transition-all ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'}`}>
          <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <FiSearch className={`text-3xl ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
          </div>
          <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>No products found matching your criteria</p>
          <button 
            onClick={handleResetFilters} 
            className={`mt-4 px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-green-700 text-white hover:bg-green-800' : 'bg-green-600 text-white hover:bg-green-700'}`}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          {loading && (
            <div className="flex justify-center mt-6">
              <FiLoader className={`animate-spin text-2xl ${isDarkMode ? 'text-green-300' : 'text-green-600'}`} />
            </div>
          )}
        </>
      )}
    </div>
  );
  }
