import { useState, useEffect } from "react";
import axios from "axios";
import api from '../../utils/api';
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function AddProduct() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  price: "",
    discountPercentage: "",
    quantity: 1,
    category: "",
    brand: "",
  // sku will be generated automatically
    weight: "",
    dimensions: { width: "", height: "", depth: "" },
    warrantyInformation: "",
    shippingInformation: "",
    availabilityStatus: "In Stock",
    returnPolicy: "",
    minimumOrderQuantity: 1,
    tags: "",
    image: null,
    extraImages: [],
  });

  const [imagePreview, setImagePreview] = useState("");
  const [extraImagesPreviews, setExtraImagesPreviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showNewCategoryField, setShowNewCategoryField] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  // Removed apiUrl, use backend URLs as-is
  useEffect(() => {
    const fetchData = async () => {
      try {
        setCategoriesLoading(true);
        setError("");
        const [categoriesRes, countsRes] = await Promise.all([
          api.get('/api/products/categories', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
          api.get('/api/products/category-counts', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({}))
        ]);
        let categoriesData = [];
        if (Array.isArray(categoriesRes.data)) {
          categoriesData = categoriesRes.data;
        } else if (categoriesRes.data && typeof categoriesRes.data === 'object') {
          categoriesData = Object.keys(categoriesRes.data);
        }
        setCategories(categoriesData);
        setCategoryCounts(countsRes.data || {});
      } catch (err) {
        console.error("Error loading data:", err);
        setCategories([]);
        setCategoryCounts({});
      } finally {
        setCategoriesLoading(false);
      }
    };
    if (token) {
      fetchData();
    }
  }, [token]);


  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("dimensions.")) {
      const dimensionField = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === "quantity" || name === "minimumOrderQuantity"
          ? Math.max(1, parseInt(value) || 1)
          : value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // التحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a valid image (JPEG, PNG, or WEBP)");
      return;
    }

    setFormData(prev => ({ ...prev, image: file }));
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const handleExtraImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (let file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be less than 5MB");
        return;
      }
      if (!file.type.match('image.*')) {
        setError("Please upload image files only (JPEG, PNG, GIF, WEBP)");
        return;
      }
    }

    if (files.length + formData.extraImages.length > 5) {
      setError("Maximum 5 additional images allowed");
      return;
    }

    const combinedFiles = [...formData.extraImages, ...files];
    setFormData(prev => ({ ...prev, extraImages: combinedFiles }));

    const previews = files.map(file => URL.createObjectURL(file));
    setExtraImagesPreviews(prev => [...prev, ...previews]);
    setError("");
  };

  const removeMainImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview("");
  };

  const removeExtraImage = (index) => {
    const newFiles = [...formData.extraImages];
    const newPreviews = [...extraImagesPreviews];

    URL.revokeObjectURL(newPreviews[index]);
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);

    setFormData(prev => ({ ...prev, extraImages: newFiles }));
    setExtraImagesPreviews(newPreviews);
  };

  const addNewCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setFormData(prev => ({ ...prev, category: newCategory }));
      setNewCategory("");
      setShowNewCategoryField(false);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Product title is required");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Product description is required");
      return false;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError("Please enter a valid price");
      return false;
    }
    if (!formData.category) {
      setError("Please select a category");
      return false;
    }
    if (!formData.image) {
      setError("Product image is required");
      return false;
    }
    return true;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  // التحقق من الحقول المطلوبة
  if (!formData.title || formData.title.trim() === '') {
    setError("Product title is required");
    return;
  }
  if (!formData.description || formData.description.trim() === '') {
    setError("Product description is required");
    return;
  }
  if (!formData.price || formData.price <= 0) {
    setError("Price must be greater than 0");
    return;
  }
  if (!formData.quantity || formData.quantity < 1) {
    setError("Quantity must be at least 1");
    return;
  }
  if (!formData.category || formData.category.trim() === '') {
    setError("Category is required");
    return;
  }

  setLoading(true);

  try {
    const formDataToSend = new FormData();

  // append title بشكل صحيح
  const titleToSend = Array.isArray(formData.title) ? formData.title[0] : formData.title;
  formDataToSend.append('title', titleToSend);
  // append name to avoid duplicate key error
  formDataToSend.append('name', titleToSend);


    // إرسال الحقول الأساسية الأخرى
    const basicFields = [
      'description', 'price', 'quantity', 'category',
  'brand', 'weight', 'warrantyInformation',
      'shippingInformation', 'availabilityStatus', 'returnPolicy',
      'minimumOrderQuantity', 'tags'
    ];

    basicFields.forEach(field => {
  if (formData[field]) formDataToSend.append(field, formData[field]);
    });

    // الحقول الاختيارية
  // originalPrice removed
    if (formData.discountPercentage) {
      formDataToSend.append('discountPercentage', formData.discountPercentage);
    }

    // الأبعاد
    // توليد sku تلقائي
    function generateUniqueSku() {
      return 'SKU-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    }
    formDataToSend.append('sku', generateUniqueSku());
    formDataToSend.append('dimensions', JSON.stringify(formData.dimensions || {}));

    // الصورة الرئيسية
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    // الصور الإضافية
    if (formData.extraImages && formData.extraImages.length > 0) {
      formData.extraImages.forEach(file => formDataToSend.append('extraImages', file));
    }

    const response = await api.post('/api/products', formDataToSend, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      }
    });

    if (response.status === 201) {
      setSuccess("Product added successfully!");
      setTimeout(() => navigate("/seller/my-products"), 1500);
    }

  } catch (err) {
    console.error("Add product error:", err);
    setError(err.response?.data?.message || "Error adding product");
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      extraImagesPreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [imagePreview, extraImagesPreviews]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Add New Product</h2>
        <button
          onClick={() => navigate("/seller/my-products")}
          className="text-blue-600 hover:text-blue-800"
        >
          Back to My Products
        </button>
      </div>
      {error && (
        <div className="p-3 mb-4 text-red-600 bg-red-100 rounded flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-800 font-bold">&times;</button>
        </div>
      )}
      {success && (
        <div className="p-3 mb-4 text-green-600 bg-green-100 rounded flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="text-green-800 font-bold">&times;</button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Title *
            </label>
            <input
              name="title"
              placeholder="Product title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price ($) *
            </label>
            <div className="relative">
              <input
                type="number"
                name="price"
                placeholder="0.00"
                value={formData.price}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-10"
              />
              <span className="absolute left-3 top-3 text-gray-500">$</span>
            </div>
          </div>

          {/* Original Price removed */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Percentage (%)
            </label>
            <input
              type="number"
              name="discountPercentage"
              placeholder="0-100"
              value={formData.discountPercentage}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            {categoriesLoading ? (
              <div className="p-3 bg-gray-100 rounded-lg animate-pulse">Loading categories...</div>
            ) : (
              <div className="space-y-2">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} ({categoryCounts[cat] || 0})
                    </option>
                  ))}
                </select>

                {!showNewCategoryField ? (
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryField(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add New Category
                  </button>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter new category name"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addNewCategory}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryField(false)}
                      className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity"
              placeholder="Available quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand (optional)
            </label>
            <input
              type="text"
              name="brand"
              placeholder="Product brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>



          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (g) (optional)
            </label>
            <input
              type="number"
              name="weight"
              placeholder="Product weight in grams"
              value={formData.weight}
              onChange={handleChange}
              min="0"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dimensions (cm) (optional)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <input
                  type="number"
                  name="dimensions.width"
                  placeholder="Width"
                  value={formData.dimensions.width}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  name="dimensions.height"
                  placeholder="Height"
                  value={formData.dimensions.height}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  name="dimensions.depth"
                  placeholder="Depth"
                  value={formData.dimensions.depth}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warranty Information (optional)
            </label>
            <input
              type="text"
              name="warrantyInformation"
              placeholder="Warranty details"
              value={formData.warrantyInformation}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipping Information (optional)
            </label>
            <input
              type="text"
              name="shippingInformation"
              placeholder="Shipping details"
              value={formData.shippingInformation}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Availability Status (optional)
            </label>
            <select
              name="availabilityStatus"
              value={formData.availabilityStatus}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="In Stock">In Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Pre-Order">Pre-Order</option>
              <option value="Backorder">Backorder</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Return Policy (optional)
            </label>
            <input
              type="text"
              name="returnPolicy"
              placeholder="Return policy details"
              value={formData.returnPolicy}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Order Quantity (optional)
            </label>
            <input
              type="number"
              name="minimumOrderQuantity"
              placeholder="Minimum order quantity"
              value={formData.minimumOrderQuantity}
              onChange={handleChange}
              min="1"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma separated) (optional)
            </label>
            <input
              type="text"
              name="tags"
              placeholder="tag1, tag2, tag3"
              value={formData.tags}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            placeholder="Product description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Images Section */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Image *
              <span className="text-xs text-gray-500 ml-1">(Max 5MB, JPG/PNG)</span>
            </label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Main preview"
                  className="w-40 h-40 object-contain mb-2 rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removeMainImage}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2 hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">Click to upload main image</p>
                    <p className="text-xs text-gray-500">JPG, PNG (Max 5MB)</p>
                  </div>
                  <input
  type="file"
  name="image"           // ← اضفت هذا السطر
  accept="image/jpeg, image/png, image/webp"
  onChange={handleImageChange}
  className="hidden"
  required
/>

                </label>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Images ({extraImagesPreviews.length}/5 max)
              <span className="text-xs text-gray-500 ml-1">(Max 5MB each, JPG/PNG)</span>
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {extraImagesPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-28 h-28 object-contain rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeExtraImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2 hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-2 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                  </svg>
                  <p className="text-xs text-gray-500">Click to upload additional images</p>
                </div>
                <input
  type="file"
  name="extraImages"      // ← اضفت هذا السطر
  accept="image/jpeg, image/png, image/webp"
  multiple
  onChange={handleExtraImagesChange}
  className="hidden"
/>

              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/seller/my-products")}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || categoriesLoading}
            className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${loading || categoriesLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {categoriesLoading ? "Loading..." : "Adding Product..."}
              </span>
            ) : (
              "Add Product"
            )}
          </button>
        </div>
      </form>
  </div>
    
  );
  
};