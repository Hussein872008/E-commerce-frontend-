import { useState, useEffect, useRef } from "react";
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
    weight: "",
    dimensions: { width: "", height: "", depth: "" },
    warrantyInformation: "",
    shippingInformation: "",
    returnPolicy: "",
    minimumOrderQuantity: 1,
    tags: "",
    image: null,
    extraImages: [],
  });

  const [imagePreview, setImagePreview] = useState("");
  const [extraImagesPreviews, setExtraImagesPreviews] = useState([]);
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingExtra, setIsDraggingExtra] = useState(false);
  const mainInputRef = useRef(null);
  const extraInputRef = useRef(null);
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const priceRef = useRef(null);
  const categoryRef = useRef(null);
  const quantityRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showNewCategoryField, setShowNewCategoryField] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [createdCategory, setCreatedCategory] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [activeSection, setActiveSection] = useState("basic");
  const tabsRef = useRef(null);
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const isDarkMode = useSelector((state) => state.theme.darkMode);

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

  useEffect(() => {
    try {
      if (tabsRef && tabsRef.current) {
        const activeBtn = tabsRef.current.querySelector('[data-active="true"]');
        if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
          activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    } catch (e) {
    }
  }, [activeSection]);



  const handleChange = (e) => {
    const { name, value } = e.target;

  if (saved) setSaved(false);

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
  if (saved) setSaved(false);
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a valid image (JPEG, PNG, or WEBP)");
      return;
    }

    setFormData(prev => ({ ...prev, image: file }));
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const handleMainDrop = (e) => {
    e.preventDefault();
    setIsDraggingMain(false);
  if (saved) setSaved(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

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
  if (saved) setSaved(false);
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

  const handleExtraDrop = (e) => {
    e.preventDefault();
    setIsDraggingExtra(false);
  if (saved) setSaved(false);
    const files = Array.from(e.dataTransfer?.files || []);
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
  if (saved) setSaved(false);
  setFormData(prev => ({ ...prev, image: null }));
  setImagePreview("");
  };

  const removeExtraImage = (index) => {
  if (saved) setSaved(false);
    const newFiles = [...formData.extraImages];
    const newPreviews = [...extraImagesPreviews];

    URL.revokeObjectURL(newPreviews[index]);
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);

    setFormData(prev => ({ ...prev, extraImages: newFiles }));
    setExtraImagesPreviews(newPreviews);
  };

  const addNewCategory = () => {
    const trimmed = (newCategory || "").trim();
    if (!trimmed) return;
    let nextCategories = [...categories];
    if (createdCategory) {
      nextCategories = nextCategories.filter(c => c !== createdCategory);
    }
    if (!nextCategories.includes(trimmed)) {
      nextCategories.push(trimmed);
    }
    setCategories(nextCategories);
    setFormData(prev => ({ ...prev, category: trimmed }));
    setCreatedCategory(trimmed);
    setNewCategory("");
    setShowNewCategoryField(false);
  };

  const handleDeleteCategory = (cat) => {
    setCategories(prev => prev.filter(c => c !== cat));
    setCreatedCategory(prev => (prev === cat ? null : prev));
    setFormData(prev => ({ ...prev, category: prev.category === cat ? "" : prev.category }));
  };

  const startEditCategory = (cat) => {
    setEditingCategory(cat);
    setEditCategoryName(cat);
    setShowNewCategoryField(false);
  };

  const saveEditCategory = () => {
    const trimmed = (editCategoryName || "").trim();
    if (!trimmed) return;
    setCategories(prev => prev.map(c => (c === editingCategory ? trimmed : c)));
    if (formData.category === editingCategory) {
      setFormData(prev => ({ ...prev, category: trimmed }));
    }
    if (createdCategory === editingCategory) setCreatedCategory(trimmed);
    setEditingCategory(null);
    setEditCategoryName("");
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditCategoryName("");
  };

  const validateSection = (section) => {
    if (section === 'basic') {
      if (!formData.title || !String(formData.title).trim()) return { ok: false, field: 'title' };
      if (!formData.description || !String(formData.description).trim()) return { ok: false, field: 'description' };
      if (!formData.price || Number(formData.price) <= 0) return { ok: false, field: 'price' };
      if (!formData.category || String(formData.category).trim() === '') return { ok: false, field: 'category' };
      if (!formData.quantity || Number(formData.quantity) < 1) return { ok: false, field: 'quantity' };
    }
    if (section === 'details') {
      return { ok: true };
    }
    return { ok: true };
  };

  const handleChangeSection = (target) => {
    const order = ['basic', 'details', 'images'];
    const fromIdx = order.indexOf(activeSection);
    const toIdx = order.indexOf(target);
    if (toIdx > fromIdx) {
      const res = validateSection(activeSection);
      if (!res.ok) {
        setError('Please complete required fields before proceeding');
        const refs = {
          title: titleRef,
          description: descriptionRef,
          price: priceRef,
          category: categoryRef,
          quantity: quantityRef,
          image: mainInputRef,
        };
        const ref = refs[res.field];
        if (ref && ref.current && typeof ref.current.focus === 'function') {
          ref.current.focus();
        }
        return;
      }
    }
    setActiveSection(target);
    setError('');
  };

  const handleNext = () => {
    if (activeSection === 'basic') return handleChangeSection('details');
    if (activeSection === 'details') return handleChangeSection('images');
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
    if (formData.minimumOrderQuantity && Number(formData.minimumOrderQuantity) > 0 && Number(formData.minimumOrderQuantity) > Number(formData.quantity)) {
      setError("Minimum order quantity cannot be greater than total quantity");
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

      const titleToSend = Array.isArray(formData.title) ? formData.title[0] : formData.title;
      formDataToSend.append('title', titleToSend);
      formDataToSend.append('name', titleToSend);

      const basicFields = [
        'description', 'price', 'quantity', 'category',
        'brand', 'weight', 'warrantyInformation',
        'shippingInformation', 'availabilityStatus', 'returnPolicy',
        'minimumOrderQuantity', 'tags'
      ];

      basicFields.forEach(field => {
        const val = formData[field];
        if (val !== undefined && val !== null) {
          if (typeof val === 'string') {
            if (val.trim() !== '') formDataToSend.append(field, val.trim());
          } else {
            formDataToSend.append(field, val);
          }
        }
      });

      if (formData.discountPercentage !== undefined && formData.discountPercentage !== null && String(formData.discountPercentage).trim() !== '') {
        formDataToSend.append('discountPercentage', formData.discountPercentage);
      }

      function generateUniqueSku() {
        return 'SKU-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      }
      formDataToSend.append('sku', generateUniqueSku());
      formDataToSend.append('dimensions', JSON.stringify(formData.dimensions || {}));

      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      if (formData.extraImages && formData.extraImages.length > 0) {
        formData.extraImages.forEach(file => formDataToSend.append('extraImages', file));
      }

      try {
      } catch (logErr) {
      }

      const response = await api.post('/api/products', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.status === 201) {
        setSuccess("✅ Product added successfully!");
        setSaved(true);
        setTimeout(() => {
          window.location.replace('/seller/my-products');
        }, 1500);
      }

    } catch (err) {
      try {
        console.error("Add product error:", err);
        if (err.response) {
          console.error('Response status:', err.response.status);
          console.error('Response data:', err.response.data);
        }
      } catch (logErr) {
        console.error('Error while logging error object', logErr);
      }

      setError(
        err.response?.data?.message || (err.response && JSON.stringify(err.response.data)) || "Error adding product"
      );
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
    <div className={`w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300 pb-28 ${isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-blue-950 to-purple-950 text-gray-100 shadow-lg ring-1 ring-gray-700'
        : 'bg-white/95 backdrop-blur-sm rounded-xl shadow-xl ring-1 ring-slate-200/50 hover:shadow-2xl'
      }`}>
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className={`text-3xl font-bold ${isDarkMode
              ? 'text-white'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
            }`}>
            Add New Product
          </h2>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Fill in the product details in the sections below
          </p>
        </div>
        <button
          onClick={() => navigate("/seller/my-products")}
          className={`flex items-center gap-2 px-3 py-2 transition-all duration-200 rounded-lg ${isDarkMode
              ? 'text-white/90 hover:text-white/100 hover:bg-gray-800/50 hover:shadow-md'
              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 hover:shadow-md'
            }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to My Products
        </button>
      </div>

      {error && (
        <div className={`p-4 mb-6 rounded-lg flex justify-between items-center shadow-sm animate-fade-in ${isDarkMode
            ? 'bg-red-900/30 border border-red-700/30'
            : 'bg-red-50 border border-red-100'
          }`}>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className={isDarkMode ? 'text-red-400' : 'text-red-700'}>{error}</span>
          </div>
          <button
            onClick={() => setError("")}
            className={`rounded-full p-1 transition-colors ${isDarkMode
                ? 'text-red-400 hover:text-red-300 hover:bg-red-800/50'
                : 'text-red-700 hover:text-red-800 hover:bg-red-100'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {success && (
        <div className={`p-4 mb-6 rounded-lg flex justify-between items-center shadow-sm animate-fade-in ${isDarkMode
            ? 'bg-green-900/30 border border-green-700/30'
            : 'bg-green-50 border border-green-100'
          }`}>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className={isDarkMode ? 'text-green-400' : 'text-green-700'}>{success}</span>
          </div>
          <button
            onClick={() => setSuccess("")}
            className={`rounded-full p-1 transition-colors ${isDarkMode
                ? 'text-green-400 hover:text-green-300 hover:bg-green-800/50'
                : 'text-green-700 hover:text-green-800 hover:bg-green-100'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div className={`mb-6 border-b ${isDarkMode ? 'border-gray-700/30' : 'border-gray-200'}`}>
        <div ref={tabsRef} className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveSection("basic")}
            data-active={activeSection === 'basic'}
            className={`flex-shrink-0 px-4 sm:px-6 py-3 font-medium text-sm rounded-t-lg transition-all duration-300 flex items-center gap-2 ${activeSection === "basic"
                ? isDarkMode
                  ? "bg-blue-900/30 text-blue-400 border-b-2 border-blue-400"
                  : "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                : isDarkMode
                  ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Basic Information
          </button>
          <button
            onClick={() => handleChangeSection("details")}
            data-active={activeSection === 'details'}
            className={`flex-shrink-0 px-4 sm:px-6 py-3 font-medium text-sm rounded-t-lg transition-all duration-300 flex items-center gap-2 ${activeSection === "details"
                ? isDarkMode
                  ? "bg-blue-900/30 text-blue-400 border-b-2 border-blue-400"
                  : "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                : isDarkMode
                  ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Product Details
          </button>
          <button
            onClick={() => handleChangeSection("images")}
            data-active={activeSection === 'images'}
            className={`flex-shrink-0 px-4 sm:px-6 py-3 font-medium text-sm rounded-t-lg transition-all duration-300 flex items-center gap-2 ${activeSection === "images"
                ? isDarkMode
                  ? "bg-blue-900/30 text-blue-400 border-b-2 border-blue-400"
                  : "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                : isDarkMode
                  ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Images
          </button>
        </div>
      </div>

  <form onSubmit={handleSubmit} className="space-y-8 relative">
        {(activeSection === "basic") && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in ${isDarkMode ? '' : ''}`}>
            <div className="md:col-span-2">
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Basic Information
              </h3>
            </div>

            <div className="space-y-1">
              <div className="relative group">
                <label
                  htmlFor="title"
                  className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                      ? 'text-gray-400 peer-focus:text-blue-400 bg-gray-900'
                      : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                    } peer-placeholder-shown:top-1/3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                >
                  Product Title (Required)
                </label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  placeholder=" "
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className={`peer w-full p-3 sm:p-4 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                      : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    } group-hover:border-blue-500/30`}
                />
                <span className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Enter a clear, descriptive title for your product
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative group">
                <label
                  htmlFor="price"
                  className={`absolute left-8 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                      ? 'text-gray-400 peer-focus:text-blue-400 bg-gray-900'
                      : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                    } peer-placeholder-shown:top-1/3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                >
                  Price (Required)
                </label>
                <div className={`absolute left-4 top-[34%] -translate-y-1/2 text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>$</div>
                <input
                  id="price"
                  type="number"
                  name="price"
                  placeholder=" "
                  value={formData.price}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  required
                  className={`peer w-full p-3 sm:p-4 pl-8 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                      : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    } group-hover:border-blue-500/30`}
                />
                <span className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Set the price in USD (minimum $0.01)
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative group">
                <input
                  id="discountPercentage"
                  type="number"
                  name="discountPercentage"
                  placeholder=" "
                  value={formData.discountPercentage}
                  onChange={(e) => {
                    const value = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                    setFormData(prev => ({ ...prev, discountPercentage: value }));
                  }}
                  min="1"
                  max="100"
                  className={`peer w-full p-3 sm:p-4 pr-8 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                      : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    } group-hover:border-blue-500/30`}
                />
                <label
                  htmlFor="discountPercentage"
                  className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                      ? 'text-gray-400 peer-focus:text-blue-400 bg-gray-900'
                      : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                    } peer-placeholder-shown:top-1/3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                >
                  Discount Percentage (1-100)
                </label>
                <div className={`absolute right-4 top-[30%] -translate-y-1/2 text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>%</div>
                <span className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Set a discount between 0-100%
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative group">
                {categoriesLoading ? (
                  <div className={`p-4 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className={`h-5 w-32 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <select
                        ref={categoryRef}
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className={`peer w-full p-4 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                            ? 'bg-gray-900/50 border-gray-700/50 text-gray-100'
                            : 'bg-white/50 border-gray-300/50 text-gray-800'
                          } group-hover:border-blue-500/30`}
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat} ({categoryCounts[cat] || 0})
                          </option>
                        ))}
                      </select>
                      <label
                        htmlFor="category"
                        className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                            ? 'text-gray-400 peer-focus:text-blue-400 bg-gray-900'
                            : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                          } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                      >
                        Category (Required)
                      </label>
                      <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose a category for your product</span>
                        {createdCategory && (
                          <div className="inline-flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-green-100/60 text-sm shadow-sm transition-all duration-200 ">
                            <span className="font-medium">{createdCategory}</span>
                            <button type="button" onClick={() => startEditCategory(createdCategory)} className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
                            <button type="button" onClick={() => handleDeleteCategory(createdCategory)} className="text-xs text-red-600 hover:text-red-800">Delete</button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {!showNewCategoryField && !editingCategory && (
                          <button
                            type="button"
                            onClick={() => { setShowNewCategoryField(true); setEditingCategory(null); }}
                            className={`text-sm font-medium transition-all px-3 py-1 rounded-lg ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                            + Add new category
                          </button>
                        )}

                        {showNewCategoryField && (
                          <div className="flex items-center gap-2">
                            <input
                              id="newCategory"
                              name="newCategory"
                              type="text"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              placeholder="New category"
                              className={`p-2 rounded-lg text-sm border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-800'}`}
                            />
                            <button type="button" onClick={addNewCategory} className="px-3 py-1 rounded-lg bg-green-600 text-white text-sm">Add</button>
                            <button type="button" onClick={() => { setShowNewCategoryField(false); setNewCategory(''); }} className="px-3 py-1 rounded-lg bg-gray-100 text-sm">Cancel</button>
                          </div>
                        )}

                        {editingCategory && (
                          <div className="flex items-center gap-2">
                            <input id="editCategoryName" name="editCategoryName" value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} className="p-2 rounded-lg text-sm border" />
                            <button type="button" onClick={saveEditCategory} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm">Save</button>
                            <button type="button" onClick={cancelEdit} className="px-3 py-1 rounded-lg bg-gray-100 text-sm">Cancel</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative group">
                <input
                  ref={quantityRef}
                  id="quantity"
                  type="number"
                  name="quantity"
                  placeholder=" "
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  required
                  className={`peer w-full p-3 sm:p-4 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                      : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    } group-hover:border-blue-500/30`}
                />
                <label
                  htmlFor="quantity"
                  className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                      ? 'text-gray-400 peer-focus:text-blue-400 bg-gray-900'
                      : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                    } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                >
                  Quantity in Stock (Required)
                </label>
                <span className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Enter the available quantity (minimum 1)
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="text"
                  name="brand"
                  id="brand"
                  placeholder=" "
                  value={formData.brand}
                  onChange={handleChange}
                  className={`peer w-full p-4 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                      : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    } group-hover:border-blue-500/30`}
                />
                <label
                  htmlFor="brand"
                  className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                      ? 'text-gray-400 peer-focus:text-blue-400 bg-gray-900'
                      : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                    } peer-placeholder-shown:top-1/3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                >
                  Brand (Optional)
                </label>
                <span className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Optional: Enter the product brand name
                </span>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <div className="relative group">
                <textarea
                  ref={descriptionRef}
                  id="description"
                  name="description"
                  placeholder=" "
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  required
                  className={`peer w-full p-3 sm:p-4 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                      ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                      : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    } group-hover:border-blue-500/30`}
                />
                <label
                  htmlFor="description"
                  className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                      ? 'text-gray-400 peer-focus:text-blue-400 bg-gray-900'
                      : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                    } peer-placeholder-shown:top-7 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                >
                  Product Description (Required)
                </label>
                <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>Provide a detailed description of your product. Include:</p>
                  <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>Key features and benefits</li>
                    <li>Materials and specifications</li>
                    <li>Usage instructions</li>
                    <li>Any unique selling points</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeSection === "details") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
            <div className="md:col-span-2">
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Product Details
              </h3>
            </div>

            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="number"
                  name="weight"
                  id="weight"
                  placeholder=" "
                  value={formData.weight}
                  onChange={handleChange}
                  min="0"
                  className={`peer w-full p-4 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                    ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                    : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    } group-hover:border-blue-500/30`}
                />
                <label
                  htmlFor="weight"
                  className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                    ? 'text-gray-400 peer-focus:text-blue-400 peer-placeholder-shown:bg-gray-900 bg-gray-900'
                    : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                    } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                >
                  Weight (g) (optional)
                </label>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <div className="relative group">
                <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Dimensions (cm) (optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative group">
                    <input
                      type="number"
                      name="dimensions.width"
                      id="dimensions.width"
                      placeholder=" "
                      value={formData.dimensions.width}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className={`peer w-full p-4 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                        ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                        : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                        } group-hover:border-blue-500/30`}
                    />
                    <label
                      htmlFor="dimensions.width"
                      className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                        ? 'text-gray-400 peer-focus:text-blue-400 peer-placeholder-shown:bg-gray-900 bg-gray-900'
                        : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                        } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                    >
                      Width
                    </label>
                  </div>
                  <div className="relative group">
                    <input
                      type="number"
                      name="dimensions.height"
                      id="dimensions.height"
                      placeholder=" "
                      value={formData.dimensions.height}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className={`peer w-full p-4 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                        ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                        : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                        } group-hover:border-blue-500/30`}
                    />
                    <label
                      htmlFor="dimensions.height"
                      className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                        ? 'text-gray-400 peer-focus:text-blue-400 peer-placeholder-shown:bg-gray-900 bg-gray-900'
                        : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                        } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                    >
                      Height
                    </label>
                  </div>
                  <div className="relative group">
                    <input
                      type="number"
                      name="dimensions.depth"
                      id="dimensions.depth"
                      placeholder=" "
                      value={formData.dimensions.depth}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className={`peer w-full p-4 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                        ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                        : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                        } group-hover:border-blue-500/30`}
                    />
                    <label
                      htmlFor="dimensions.depth"
                      className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                        ? 'text-gray-400 peer-focus:text-blue-400 peer-placeholder-shown:bg-gray-900 bg-gray-900'
                        : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                        } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                    >
                      Depth
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="text"
                  name="warrantyInformation"
                  id="warrantyInformation"
                  placeholder=" "
                  value={formData.warrantyInformation}
                  onChange={handleChange}
                  className={`peer w-full p-4 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                    ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                    : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    } group-hover:border-blue-500/30`}
                />
                <label
                  htmlFor="warrantyInformation"
                  className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                    ? 'text-gray-400 peer-focus:text-blue-400 peer-placeholder-shown:bg-gray-900 bg-gray-900'
                    : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                    } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                >
                  Warranty Information (optional)
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="text"
                  name="shippingInformation"
                  id="shippingInformation"
                  placeholder=" "
                  value={formData.shippingInformation}
                  onChange={handleChange}
                  className={`peer w-full p-4 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                    ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                    : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    } group-hover:border-blue-500/30`}
                />
                <label
                  htmlFor="shippingInformation"
                  className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                    ? 'text-gray-400 peer-focus:text-blue-400 peer-placeholder-shown:bg-gray-900 bg-gray-900'
                    : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                    } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                >
                  Shipping Information (optional)
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="text"
                  name="returnPolicy"
                  id="returnPolicy"
                  placeholder=" "
                  value={formData.returnPolicy}
                  onChange={handleChange}
                  className={`peer w-full p-4 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                    ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                    : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    } group-hover:border-blue-500/30`}
                />
                <label
                  htmlFor="returnPolicy"
                  className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                    ? 'text-gray-400 peer-focus:text-blue-400 peer-placeholder-shown:bg-gray-900 bg-gray-900'
                    : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                    } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                >
                  Return Policy (optional)
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="number"
                  name="minimumOrderQuantity"
                  id="minimumOrderQuantity"
                  placeholder=" "
                  value={formData.minimumOrderQuantity}
                  onChange={handleChange}
                  min="1"
                  className={`peer w-full p-4 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                    ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                    : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    } group-hover:border-blue-500/30`}
                />
                <label
                  htmlFor="minimumOrderQuantity"
                  className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                    ? 'text-gray-400 peer-focus:text-blue-400 peer-placeholder-shown:bg-gray-900 bg-gray-900'
                    : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                    } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                >
                  Minimum Order Quantity (optional)
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="text"
                  name="tags"
                  id="tags"
                  placeholder=" "
                  value={formData.tags}
                  onChange={handleChange}
                  className={`peer w-full p-4 rounded-lg transition-all duration-300 border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDarkMode
                    ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder-transparent'
                    : 'bg-white/50 border-gray-300/50 text-gray-800 placeholder-transparent'
                    } group-hover:border-blue-500/30`}
                />
                <label
                  htmlFor="tags"
                  className={`absolute left-3 px-1 text-sm transition-all duration-200 transform -translate-y-1/2 pointer-events-none ${isDarkMode
                    ? 'text-gray-400 peer-focus:text-blue-400 peer-placeholder-shown:bg-gray-900 bg-gray-900'
                    : 'text-gray-500 peer-focus:text-blue-600 bg-white'
                    } peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-sm`}
                >
                  Tags (comma separated) (optional)
                </label>
              </div>
            </div>
          </div>
        )}

        {(activeSection === "images") && (
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
                
                {imagePreview ? (
                  <div className="relative inline-block group">
                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-900/50' : 'bg-white'} shadow-lg ring-1 ring-gray-900/5 transition duration-300 group-hover:shadow-xl`}>
                      <img
                        src={imagePreview}
                        alt="Main preview"
                        className="w-full max-w-xs sm:max-w-sm h-auto sm:h-64 object-contain rounded-lg"
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
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingMain(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDraggingMain(false); }}
                      onDrop={handleMainDrop}
                      className={`group flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                        isDarkMode 
                          ? isDraggingMain
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-700 hover:border-blue-500/50 hover:bg-gray-800'
                          : isDraggingMain
                            ? 'border-blue-500 bg-blue-50'
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
                        ref={mainInputRef}
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
                    Optional • {extraImagesPreviews.length}/5 images • Max 5MB each
                  </span>
                </label>

                <div className="space-y-6">
                  {extraImagesPreviews.length > 0 && (
                    <div
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingExtra(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDraggingExtra(false); }}
                      onDrop={handleExtraDrop}
                    >
                      {extraImagesPreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                          <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-gray-900/50' : 'bg-white'} shadow-sm ring-1 ring-gray-900/5 transition duration-300 group-hover:shadow-md`}>
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-28 sm:h-32 object-contain rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeExtraImage(index)}
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

                  {extraImagesPreviews.length < 5 && (
                    <div className="flex items-center justify-center w-full transition-all duration-300">
                      <label
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingExtra(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDraggingExtra(false); }}
                        onDrop={handleExtraDrop}
                        className={`group flex flex-col items-center justify-center w-full h-36 sm:h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                          isDarkMode 
                            ? isDraggingExtra
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-gray-700 hover:border-blue-500/50 hover:bg-gray-800'
                            : isDraggingExtra
                              ? 'border-blue-500 bg-blue-50'
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
                            Add more images ({5 - extraImagesPreviews.length} remaining)
                          </p>
                        </div>
                        <input
                          ref={extraInputRef}
                          type="file"
                          name="extraImages"
                          accept="image/jpeg, image/png, image/webp"
                          onChange={handleExtraImagesChange}
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

  <div className="mt-8">
    <div className={`rounded-2xl shadow-lg border p-4 sm:p-6 transition-all duration-300 ${
    isDarkMode 
      ? 'bg-gray-800/90 border-gray-700' 
      : 'bg-white border-gray-200'
  }`}>
    <div className="flex justify-between items-center">
      
      {activeSection !== "basic" && (
        <button
          type="button"
          onClick={() => setActiveSection(activeSection === "details" ? "basic" : "details")}
          className={`group px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-300 ${
            isDarkMode
              ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600 hover:text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:-translate-x-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {activeSection === "details" ? "Back to Basic Info" : "Back to Details"}
        </button>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        {activeSection !== "images" ? (
          <button
            type="button"
            onClick={() => handleNext()}
            className={`group px-4 sm:px-6 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5 shadow-md w-full sm:w-auto ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
            }`}
          >
            {activeSection === "basic" ? "Continue to Details" : "Continue to Images"}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className={`group px-6 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5 shadow-md w-full sm:w-auto ${
              loading
                ? isDarkMode
                  ? 'bg-blue-500/50 cursor-not-allowed text-white/70'
                  : 'bg-blue-400 cursor-not-allowed text-white/80'
                : saved
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : isDarkMode
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Adding Product...</span>
              </>
            ) : saved ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L8 11.172 4.707 7.879a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
                </svg>
                <span>Added</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Add Product</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  </div>
</div>

      </form>

    </div>
  );
}