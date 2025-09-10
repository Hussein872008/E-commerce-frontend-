import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api, { setAuthToken } from '../../utils/api';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const isDarkMode = useSelector((state) => state.theme.darkMode);

  const [product, setProduct] = useState({
    title: "",
    description: "",
    price: "",
    discountPercentage: "",
    quantity: 1,
    category: "",
    brand: "",
    sku: "",
    weight: "",
    dimensions: { width: "", height: "", depth: "" },
    warrantyInformation: "",
    shippingInformation: "",
    returnPolicy: "",
    minimumOrderQuantity: 1,
    tags: [],
    image: null,
    extraImages: [],
    existingImage: "",
    existingExtraImages: [],
    extraImagesPreviews: [],
  });

  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saved, setSaved] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("basic");

  const [originalProduct, setOriginalProduct] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const getComparableProduct = (p) => {
    if (!p) return null;
    return JSON.stringify({
      title: p.title || "",
      description: p.description || "",
      price: p.price || "",
      discountPercentage: p.discountPercentage || 0,
      quantity: p.quantity || 1,
      category: p.category || "",
      brand: p.brand || "",
      weight: p.weight || "",
      dimensions: p.dimensions || { width: "", height: "", depth: "" },
      warrantyInformation: p.warrantyInformation || "",
      shippingInformation: p.shippingInformation || "",
      returnPolicy: p.returnPolicy || "",
      minimumOrderQuantity: p.minimumOrderQuantity || 1,
      tags: Array.isArray(p.tags) ? p.tags : [] ,
      existingImage: p.existingImage || "",
      existingExtraImages: Array.isArray(p.existingExtraImages) ? p.existingExtraImages : []
    });
  };

  useEffect(() => {
    if (!originalProduct) return;
    const current = getComparableProduct(product);
    setDirty(current !== originalProduct);
  }, [product, originalProduct]);

  const validateField = (name, value) => {
    switch (name) {
      case 'title':
        if (!value || !String(value).trim()) return 'Title is required';
        return '';
      case 'price':
        if (!value || Number(value) <= 0) return 'Enter a valid price';
        return '';
      case 'description':
        if (!value || !String(value).trim()) return 'Description is required';
        return '';
      case 'category':
        if (!value) return 'Please select a category';
        return '';
      case 'minimumOrderQuantity':
        if (product && product.quantity !== undefined && Number(value) > Number(product.quantity)) {
          return 'Minimum order quantity cannot be greater than total quantity';
        }
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const msg = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: msg }));
  };


  useEffect(() => {
    const fetchCategories = async () => {
      try {
  const res = await api.get('/api/products/categories', { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to load categories", err);
        setError("Failed to load categories");
      }
    };
    fetchCategories();
  }, [token]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setProductLoading(true);
  const res = await api.get(`/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });

    const data = res.data;

  const loaded = {
      title: data.title ?? "",
      description: data.description ?? "",
      price: data.price ?? "",
      discountPercentage: data.discountPercentage ?? 0,
      quantity: data.quantity ?? 1,
      category: data.category ?? "",
      brand: data.brand ?? "",
      sku: data.sku ?? "",
      weight: data.weight ?? "",
      dimensions: data.dimensions ?? { width: "", height: "", depth: "" },
      warrantyInformation: data.warrantyInformation ?? "",
      shippingInformation: data.shippingInformation ?? "",
      returnPolicy: data.returnPolicy ?? "",
      minimumOrderQuantity: data.minimumOrderQuantity ?? 1,
      tags: data.tags ?? [],
      image: null,
      extraImages: [],
      existingImage: data.image || "",
      existingExtraImages: data.extraImages || [],
      extraImagesPreviews: [],
    };

  setProduct(loaded);
  setOriginalProduct(getComparableProduct(loaded));
        
      } catch (err) {
        console.error("Failed to load product:", err);
        setError("⚠️ Failed to load product data");
        if (err.response?.status === 404) {
          navigate("/seller/my-products");
        }
      } finally {
        setProductLoading(false);
      }
    };

    if (token && id) {
      fetchProduct();
    }
  }, [id, token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
  if (saved) setSaved(false);
  setDirty(true);
    if (name.startsWith("dimensions.")) {
      const dimensionField = name.split(".")[1];
      setProduct(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionField]: value
        }
      }));
    } else {
      setProduct(prev => ({
        ...prev,
        [name]: name === "quantity" || name === "minimumOrderQuantity"
          ? Math.max(1, parseInt(value) || 1)
          : value
      }));
    }
    if (name === 'minimumOrderQuantity') {
      const minVal = Number(value) || 0;
      const qty = Number(product.quantity) || 0;
      setFieldErrors(prev => ({ ...prev, minimumOrderQuantity: minVal > qty ? 'Minimum order quantity cannot be greater than total quantity' : '' }));
    }
    if (name === 'quantity') {
      const qty = Number(value) || 0;
      const minVal = Number(product.minimumOrderQuantity) || 0;
      setFieldErrors(prev => ({ ...prev, minimumOrderQuantity: minVal > qty ? 'Minimum order quantity cannot be greater than total quantity' : '' }));
    }
  };

  const handleImageChange = (e) => {
  if (saved) setSaved(false);
    const { name, files } = e.target;
    if (!files || files.length === 0) return;

    const maxSize = 5 * 1024 * 1024;
    for (let file of files) {
      if (file.size > maxSize) {
        setError("Image size must be less than 5MB");
        return;
      }
      if (!file.type.match('image.*')) {
        setError("Please upload image files only (JPEG, PNG, GIF, WEBP)");
        return;
      }
    }

    if (name === "image") {
      setProduct({
        ...product,
        image: files[0]
      });
  setDirty(true);
    } else if (name === "extraImages") {
      if (product.existingExtraImages.length + product.extraImagesPreviews.length + files.length > 5) {
        setError("You can add up to 5 images maximum");
        return;
      }

      const newImagePreviews = Array.from(files).map(file =>
        URL.createObjectURL(file)
      );

      setProduct({
        ...product,
        extraImages: [...product.extraImages, ...Array.from(files)],
        extraImagesPreviews: [...product.extraImagesPreviews, ...newImagePreviews]
      });
  setDirty(true);
    }
    setError("");
  };

const handleRemoveExtraImage = async (index) => {
  try {
  if (saved) setSaved(false);
  setDirty(true);
    const isNewImage = index >= product.existingExtraImages.length;
    if (isNewImage) {
      const imageIndex = index - product.existingExtraImages.length;
      const previewUrl = product.extraImagesPreviews[imageIndex];
      if (previewUrl) URL.revokeObjectURL(previewUrl);

      setProduct(prev => ({
        ...prev,
        extraImages: prev.extraImages.filter((_, i) => i !== imageIndex),
        extraImagesPreviews: prev.extraImagesPreviews.filter((_, i) => i !== imageIndex),
      }));
    } else {
      const imageUrl = product.existingExtraImages[index];
      const filename = imageUrl.split('/').pop();
      const imagePath = `/uploads/${filename}`;
      setAuthToken(token);
      await api.put(`/api/products/${id}/delete-image`, { imagePath });

      setProduct(prev => ({
        ...prev,
        existingExtraImages: prev.existingExtraImages.filter((_, i) => i !== index),
      }));

      if (typeof toast !== 'undefined') {
        toast.success("Image deleted successfully");
      }
    }
  } catch (err) {
    console.error("Failed to delete image:", err);
    if (typeof toast !== 'undefined') {
      toast.error(err.response?.data?.error || "Failed to delete image");
    }
  }
};

  const removeMainImage = () => {
  if (saved) setSaved(false);
    setProduct(prev => ({
      ...prev,
      existingImage: "",
      image: null
    }));
  setDirty(true);
  };

  const validateForm = () => {
    if (!product.title.trim()) {
      setError("Product title is required");
      return false;
    }
    if (!product.description.trim()) {
      setError("Product description is required");
      return false;
    }
    if (!product.price || Number(product.price) <= 0) {
      setError("Please enter a valid price");
      return false;
    }
    if (!product.category) {
      setError("Please select a category");
      return false;
    }
    if (!product.existingImage && !product.image) {
      setError("Product image is required");
      return false;
    }
    if (product.minimumOrderQuantity && Number(product.minimumOrderQuantity) > Number(product.quantity)) {
      setError("Minimum order quantity cannot be greater than total quantity");
      setFieldErrors(prev => ({ ...prev, minimumOrderQuantity: 'Minimum order quantity cannot be greater than total quantity' }));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", product.title);
      formData.append("description", product.description);
  formData.append("price", product.price);
      formData.append("discountPercentage", product.discountPercentage || 0);
      formData.append("quantity", product.quantity);
      formData.append("category", product.category);
      formData.append("brand", product.brand || "");
      formData.append("sku", product.sku || "");
      formData.append("weight", product.weight || "");
      formData.append("dimensions", JSON.stringify(product.dimensions));
      formData.append("warrantyInformation", product.warrantyInformation || "");
      formData.append("shippingInformation", product.shippingInformation || "");
      formData.append("returnPolicy", product.returnPolicy || "");
      formData.append("minimumOrderQuantity", product.minimumOrderQuantity || 1);
      formData.append("tags", product.tags.join(",") || "");

      if (product.image) {
        formData.append("image", product.image);
      }

      product.extraImages.forEach((file) => {
        formData.append("extraImages", file);
      });

  const res = await api.put(`/api/products/${id}`, formData, { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }, withCredentials: true });

      setSuccessMsg("✅ Product updated successfully");
      setSaved(true);
      setTimeout(() => {
        navigate("/seller/my-products");
      }, 1500);
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "❌ Update failed, please check the fields";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (product.extraImagesPreviews && product.extraImagesPreviews.length > 0) {
        product.extraImagesPreviews.forEach(img => {
          URL.revokeObjectURL(img);
        });
      }
    };
  }, [product.extraImagesPreviews]);

  if (productLoading) {
    return (
      <div className={`max-w-6xl mx-auto p-6 pb-32 transition-all duration-300 ${isDarkMode
        ? 'bg-[#141E3E] text-gray-100 shadow-lg ring-1 ring-gray-700'
        : 'bg-white/95 backdrop-blur-sm rounded-xl shadow-xl ring-1 ring-slate-200/50 hover:shadow-2xl'
      }`}>
        <div className="animate-pulse space-y-6">
          <div className={`h-8 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'}`} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`h-14 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'}`} />
            <div className={`h-14 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'}`} />
            <div className={`h-14 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'}`} />
            <div className={`h-14 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'}`} />
            <div className={`h-40 md:col-span-2 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'}`} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`h-40 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'}`} />
            <div className={`h-40 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto p-4 pb-32 transition-all duration-200 ${isDarkMode ? 'bg-[#141E3E] text-gray-100 rounded-lg shadow-lg ring-1 ring-gray-700' : 'bg-white/80 rounded-lg shadow-md'}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Edit Product</h2>
        <button
          onClick={() => navigate("/seller/my-products")}
          className={`transition-colors duration-200 ${isDarkMode ? 'text-white/90 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}
        >
          Back to My Products
        </button>
      </div>

      {error && (
        <div className={`p-4 mb-6 rounded-lg ${isDarkMode ? 'bg-red-900/30 text-red-300 border border-red-700/30' : 'bg-red-100 text-red-700'}`}>
          <span className="font-medium">⚠️ Error!</span> {error}
        </div>
      )}

      {successMsg && (
        <div className={`p-4 mb-6 rounded-lg ${isDarkMode ? 'bg-green-900/20 text-green-300 border border-green-700/20' : 'bg-green-100 text-green-700'}`}>
          <span className="font-medium">✓ Success!</span> {successMsg}
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("basic")}
            className={`${activeTab === "basic"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Basic Information
          </button>
          <button
            onClick={() => setActiveTab("images")}
            className={`${activeTab === "images"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Images
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === "basic" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="space-y-1">
              <div className="relative group">
                <input
                  name="title"
                  id="title"
                  placeholder=" "
                  value={product.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`peer w-full p-3 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                      : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    }`}
                />
                {fieldErrors.title && <p className="text-sm text-red-500 mt-1">{fieldErrors.title}</p>}
                <label
                  htmlFor="title"
                  className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                      ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E]'
                      : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                    } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                >
                  Product Name (Required)
                </label>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-1">
              <div className="relative group">
                <div className={`absolute left-3 top-[45%] -translate-y-1/2 text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>$</div>
                <input
                  id="price"
                  type="number"
                  name="price"
                  placeholder=" "
                  value={product.price}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min="0.01"
                  step="0.01"
                  required
                  className={`peer w-full p-3 pl-8 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                      : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    }`}
                />
                {fieldErrors.price && <p className="text-sm text-red-500 mt-1">{fieldErrors.price}</p>}
                <label
                          htmlFor="price"
                          className={`absolute left-8 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                              ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E] '
                              : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                            } peer-placeholder-shown:top-1/3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                        >
                          Price (Required)
                        </label>
              </div>
            </div>

            {/* Original Price removed per design request */}

            {/* Discount */}
            <div className="space-y-1">
              <div className="relative group">
                <input
                  id="discountPercentage"
                  type="number"
                  name="discountPercentage"
                  placeholder=" "
                  value={product.discountPercentage}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className={`peer w-full p-3 pr-8 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                      : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    }`}
                />
                <label
                          htmlFor="discountPercentage"
                          className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                              ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E]'
                              : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                            } peer-placeholder-shown:top-1/3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                        >
                          Discount Percentage (0-100)
                        </label>
                <div className={`absolute right-3 top-[34%] -translate-y-1/2 text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>%</div>
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="number"
                  name="quantity"
                  id="quantity"
                  placeholder=" "
                  value={product.quantity}
                  onChange={handleChange}
                  min="1"
                  required
                  className={`peer w-full p-3 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                      : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    }`}
                />
                <label
                  htmlFor="quantity"
                  className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                      ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E]'
                      : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                    } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                >
                  Available Quantity *
                </label>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <div className="relative group">
                <select
                  id="category"
                  name="category"
                  value={product.category}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={`peer w-full p-3 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100'
                      : 'bg-white/50 border-gray-300/50 text-gray-800'
                    }`}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {fieldErrors.category && <p className="text-sm text-red-500 mt-1">{fieldErrors.category}</p>}
                <label
                          htmlFor="category"
                          className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                              ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E]'
                              : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                            } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                        >
                          Category (Required)
                        </label>
              </div>
            </div>

            {/* Brand */}
            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="text"
                  name="brand"
                  id="brand"
                  placeholder=" "
                  value={product.brand}
                  onChange={handleChange}
                  className={`peer w-full p-3 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                      : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    }`}
                />
                <label
                          htmlFor="brand"
                          className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                              ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E]'
                              : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                            } peer-placeholder-shown:top-1/3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                        >
                          Brand (Optional)
                        </label>
              </div>
            </div>

            {/* SKU removed: cannot be changed during edit */}

            {/* Weight */}
            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="number"
                  name="weight"
                  id="weight"
                  placeholder=" "
                  value={product.weight}
                  onChange={handleChange}
                  min="0"
                  className={`peer w-full p-3 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                      : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    }`}
                />
                <label
                  htmlFor="weight"
                  className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                    ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E]'
                    : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                  } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                >
                  Weight (g) (optional)
                </label>
              </div>
            </div>

            {/* Dimensions */}
            <div className="md:col-span-2 space-y-1">
              <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Dimensions (cm) (optional)</label>
              <div className="grid grid-cols-3 gap-3">
                <div className="relative group">
                  <input
                    type="number"
                    name="dimensions.width"
                    id="dimensions.width"
                    placeholder=" "
                    value={product.dimensions.width}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className={`peer w-full p-3 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                      : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    }`}
                  />
                  <label
                    htmlFor="dimensions.width"
                    className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                      ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E]'
                      : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                    } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                  >Width</label>
                </div>
                <div className="relative group">
                  <input
                    type="number"
                    name="dimensions.height"
                    id="dimensions.height"
                    placeholder=" "
                    value={product.dimensions.height}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className={`peer w-full p-3 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                      : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    }`}
                  />
                  <label htmlFor="dimensions.height" className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E]' : 'text-gray-500 peer-focus:text-blue-600 bg-white'} peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}>Height</label>
                </div>
                <div className="relative group">
                  <input
                    type="number"
                    name="dimensions.depth"
                    id="dimensions.depth"
                    placeholder=" "
                    value={product.dimensions.depth}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className={`peer w-full p-3 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                      : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    }`}
                  />
                  <label htmlFor="dimensions.depth" className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E]' : 'text-gray-500 peer-focus:text-blue-600 bg-white'} peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}>Depth</label>
                </div>
              </div>
            </div>

            {/* Warranty Information */}
            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="text"
                  name="warrantyInformation"
                  id="warrantyInformation"
                  placeholder=" "
                  value={product.warrantyInformation}
                  onChange={handleChange}
                  className={`peer w-full p-3 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                    ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                    : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                  }`}
                />
                <label htmlFor="warrantyInformation" className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E]' : 'text-gray-500 peer-focus:text-blue-600 bg-white'} peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}>Warranty Information</label>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="text"
                  name="shippingInformation"
                  id="shippingInformation"
                  placeholder=" "
                  value={product.shippingInformation}
                  onChange={handleChange}
                  className={`peer w-full p-3 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                    ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                    : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                  }`}
                />
                <label htmlFor="shippingInformation" className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E]' : 'text-gray-500 peer-focus:text-blue-600 bg-white'} peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}>Shipping Information</label>
              </div>
            </div>


            {/* Return Policy */}
            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="text"
                  name="returnPolicy"
                  id="returnPolicy"
                  placeholder=" "
                  value={product.returnPolicy}
                  onChange={handleChange}
                  className={`peer w-full p-3 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                    ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                    : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                  }`}
                />
                <label htmlFor="returnPolicy" className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E]' : 'text-gray-500 peer-focus:text-blue-600 bg-white'} peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}>Return Policy</label>
              </div>
            </div>

            {/* Minimum Order Quantity */}
            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="number"
                  name="minimumOrderQuantity"
                  id="minimumOrderQuantity"
                  placeholder=" "
                  value={product.minimumOrderQuantity}
                  onChange={handleChange}
                  className={`peer w-full p-3 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                    ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                    : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                  }`}
                  min="1"
                />
                <label htmlFor="minimumOrderQuantity" className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E]' : 'text-gray-500 peer-focus:text-blue-600 bg-white'} peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}>Minimum Order Quantity</label>
                {fieldErrors.minimumOrderQuantity && <p className="text-sm text-red-500 mt-1">{fieldErrors.minimumOrderQuantity}</p>}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="text"
                  name="tags"
                  id="tags"
                  placeholder=" "
                  value={product.tags.join(", ")}
                  onChange={(e) => {
                    const tagsArray = e.target.value.split(",").map(tag => tag.trim());
                    setProduct(prev => ({ ...prev, tags: tagsArray }));
                  }}
                  className={`peer w-full p-3 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                    ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                    : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                  }`}
                />
                <label htmlFor="tags" className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E]' : 'text-gray-500 peer-focus:text-blue-600 bg-white'} peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}>Tags (comma separated) (optional)</label>
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-1">
              <div className="relative group">
                <textarea
                  name="description"
                  placeholder=" "
                  value={product.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows="5"
                  required
                  className={`peer w-full p-3 rounded-lg transition-all duration-200 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                    ? 'bg-[#141E3E]/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                    : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                  }`}
                />
                {fieldErrors.description && <p className="text-sm text-red-500 mt-1">{fieldErrors.description}</p>}
                <label htmlFor="description" className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400 peer-focus:text-blue-400 bg-[#141E3E]' : 'text-gray-500 peer-focus:text-blue-600 bg-white'} peer-placeholder-shown:top-7 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}>Product Description (Required)</label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "images" && (
          <div className="space-y-8 animate-fade-in">
            <div className="md:col-span-2">
              <h3 className={`text-xl font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Product Images
              </h3>
            </div>

            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 ring-1 ring-gray-700' : 'bg-gray-50 ring-1 ring-gray-200'}`}>
              <div className="relative group">
                <label className={`block font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Main Product Image
                  <span className={`ml-2 font-normal text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Required • Max 5MB • JPEG, PNG supported
                  </span>
                </label>
                
                {product.existingImage || product.image ? (
                  <div className="relative inline-block group">
                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-[#141E3E]/50' : 'bg-white'} shadow-lg ring-1 ring-gray-900/5 transition duration-300 group-hover:shadow-xl`}>
                      <img
                        src={product.image ? URL.createObjectURL(product.image) : product.existingImage}
                        alt="Main preview"
                        className="w-64 h-64 object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeMainImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 transform hover:scale-110 hover:bg-red-600 transition-all duration-200 shadow-lg"
                        aria-label="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full transition-all duration-300">
                    <label
                      className={`group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                        isDarkMode 
                          ? 'border-gray-700 hover:border-blue-500/50 hover:bg-gray-800'
                          : 'border-gray-300 hover:bg-gray-100/80 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center px-6 pt-5 pb-6 space-y-3">
                        <div className={`rounded-full p-4 transition-colors duration-300 ${
                          isDarkMode
                            ? 'bg-gray-800/80 group-hover:bg-gray-700'
                            : 'bg-gray-100 group-hover:bg-gray-200'
                        }`}>
                          <svg className={`w-8 h-8 transition-colors duration-300 ${
                            isDarkMode
                              ? 'text-gray-400 group-hover:text-blue-400'
                              : 'text-gray-600 group-hover:text-blue-600'
                          }`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-center space-y-2">
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            JPEG or PNG up to 5MB
                          </p>
                        </div>
                      </div>
                      <input
                        type="file"
                        name="image"
                        accept="image/jpeg, image/png, image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 ring-1 ring-gray-700' : 'bg-gray-50 ring-1 ring-gray-200'}`}>
              <div className="relative group">
                <label className={`block font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Additional Product Images
                  <span className={`ml-2 font-normal text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Optional • {product.existingExtraImages.length + product.extraImagesPreviews.length}/5 images • Max 5MB each
                  </span>
                </label>

                <div className="space-y-6">
                  {(product.existingExtraImages.length > 0 || product.extraImagesPreviews.length > 0) && (
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    >
                      {product.existingExtraImages.map((img, idx) => (
                        <div key={`existing-${idx}`} className="relative group">
                          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-[#141E3E]/50' : 'bg-white'} shadow-lg ring-1 ring-gray-900/5 transition duration-300 group-hover:shadow-xl`}>
                            <img
                              src={img}
                              alt={`Extra image ${idx + 1}`}
                              className="w-full h-32 object-contain rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveExtraImage(idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 transform hover:scale-110 hover:bg-red-600 transition-all duration-200 shadow-lg"
                              aria-label="Remove image"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                      {product.extraImagesPreviews.map((img, idx) => (
                        <div key={`new-${idx}`} className="relative group">
                           <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-[#141E3E]/50' : 'bg-white'} shadow-lg ring-1 ring-gray-900/5 transition duration-300 group-hover:shadow-xl`}>
                            <img
                              src={img}
                              alt={`New image ${idx + 1}`}
                              className="w-full h-32 object-contain rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveExtraImage(product.existingExtraImages.length + idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 transform hover:scale-110 hover:bg-red-600 transition-all duration-200 shadow-lg"
                              aria-label="Remove image"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {product.existingExtraImages.length + product.extraImagesPreviews.length < 5 && (
                    <div className="flex items-center justify-center w-full transition-all duration-300">
                      <label
                        className={`group flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                          isDarkMode 
                            ? 'border-gray-700 hover:border-blue-500/50 hover:bg-gray-800'
                            : 'border-gray-300 hover:bg-gray-100/80 hover:border-blue-500/50'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center px-6 pt-5 pb-6 space-y-3">
                          <div className={`rounded-full p-3 transition-colors duration-300 ${
                            isDarkMode
                              ? 'bg-gray-800/80 group-hover:bg-gray-700'
                              : 'bg-gray-100 group-hover:bg-gray-200'
                          }`}>
                            <svg className={`w-6 h-6 transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-400 group-hover:text-blue-400'
                                : 'text-gray-600 group-hover:text-blue-600'
                            }`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Add more images ({5 - (product.existingExtraImages.length + product.extraImagesPreviews.length)} remaining)
                          </p>
                        </div>
                        <input
                          type="file"
                          name="extraImages"
                          accept="image/jpeg, image/png, image/webp"
                          onChange={handleImageChange}
                          multiple
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          {activeTab === "images" && (
            <button
              type="button"
              onClick={() => setActiveTab("basic")}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Back
            </button>
          )}

            <div className="flex justify-end flex-1 space-x-4">
            <button
              type="button"
              onClick={() => navigate("/seller/my-products")}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!dirty || loading}
              className={`px-6 py-3 rounded-lg text-white font-medium flex items-center ${(!dirty || loading) ? 'bg-gray-400 cursor-not-allowed' : saved ? 'bg-green-600 hover:bg-green-700' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'} transition-colors`}
            >
              {loading ? (
                <>
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
                  Saving...
                </>
              ) : saved ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 -ml-1 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L8 11.172 4.707 7.879a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
                  </svg>
                  Saved
                </>
              ) : (
                "Save Changes"
              )}
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  );
}