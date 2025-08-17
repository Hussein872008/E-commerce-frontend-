import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Pagination } from "@mui/material";

export default function MyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const productsPerPage = 8;

useEffect(() => {
  const fetchData = async () => {
    if (!token) {
      setError("Please login to view your products");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`/api/products/seller/my-products`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            page: currentPage,
            limit: productsPerPage,
            search: searchTerm,
            category: selectedCategory
          },
          withCredentials: true
        }),
        axios.get(`/api/products/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        })
      ]);

      const productsData = productsRes.data?.products || [];
      const totalProducts = productsRes.data?.total || 0;
      
      // معالجة بيانات الفئات بشكل آمن
      let categoriesData = [];
      if (Array.isArray(categoriesRes.data)) {
        categoriesData = categoriesRes.data;
      } else if (categoriesRes.data && typeof categoriesRes.data === 'object') {
        // إذا كانت البيانات كائنًا بدلاً من مصفوفة
        categoriesData = Object.keys(categoriesRes.data);
      }

      setProducts(productsData.map(product => ({
        ...product,
        image: product.image?.startsWith('http') 
          ? product.image 
          : `/uploads/${product.image?.split('/').pop()}` || '/placeholder-product.png'
      })));
      
      setTotalPages(Math.ceil(totalProducts / productsPerPage));
      setCategories(categoriesData);
      
      // لا تعرض خطأ إذا لم يكن هناك منتجات
      if (productsData.length === 0 && !categoriesData.length) {
        setError("");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      // لا تعرض خطأ إذا كان مجرد عدم وجود بيانات
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error || "Failed to load data");
      }
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [token, currentPage, searchTerm, selectedCategory]);

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`/api/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      setProducts(prevProducts => prevProducts.filter(p => p._id !== productId));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete product");
    }
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">My Products</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {Array.isArray(categories) && categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <button
            onClick={() => navigate("/seller/add-product")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
          >
            Add New Product
          </button>
        </div>
      </div>

      {error && <div className="p-3 mb-4 text-red-600 bg-red-100 rounded-lg">{error}</div>}

      {products.length === 0 && !loading ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">You don't have any products yet.</p>
          <button
            onClick={() => navigate("/seller/add-product")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Add Your First Product
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product._id} className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white">
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/150";
                    }}
                  />
                  {product.quantity <= 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      Out of Stock
                    </div>
                  )}
                  {product.quantity > 0 && product.quantity <= 5 && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
                      Low Stock
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-1 truncate">{product.title}</h2>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600 font-bold">${product.price}</p>
                    <p className="text-sm text-gray-500">{product.quantity} in stock</p>
                  </div>
                  <p className="text-sm text-gray-500 mb-3 capitalize">{product.category}</p>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                    <button
                      onClick={() => navigate(`/seller/edit-product/${product._id}`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}