import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const [product, setProduct] = useState({
    title: "",
    description: "",
    price: "",
    originalPrice: "",
    discountPercentage: "",
    quantity: 1,
    category: "",
    brand: "",
    sku: "",
    weight: "",
    dimensions: { width: "", height: "", depth: "" },
    warrantyInformation: "",
    shippingInformation: "",
    availabilityStatus: "In Stock",
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
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("basic");


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true
        });
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
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true
        });

        const data = res.data;

        setProduct({
          title: data.title ?? "",
          description: data.description ?? "",
          price: data.price ?? "",
          originalPrice: data.originalPrice ?? data.price ?? "",
          discountPercentage: data.discountPercentage ?? 0,
          quantity: data.quantity ?? 1,
          category: data.category ?? "",
          brand: data.brand ?? "",
          sku: data.sku ?? "",
          weight: data.weight ?? "",
          dimensions: data.dimensions ?? { width: "", height: "", depth: "" },
          warrantyInformation: data.warrantyInformation ?? "",
          shippingInformation: data.shippingInformation ?? "",
          availabilityStatus: data.availabilityStatus ?? "In Stock",
          returnPolicy: data.returnPolicy ?? "",
          minimumOrderQuantity: data.minimumOrderQuantity ?? 1,
          tags: data.tags ?? [],
          image: null,
          extraImages: [],
          existingImage: data.image || "",
          existingExtraImages: data.extraImages || [],
          extraImagesPreviews: [],
        });
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
  };

  const handleImageChange = (e) => {
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
    }
    setError("");
  };

const handleRemoveExtraImage = async (index) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'Do you want to delete this image?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  });
  if (!result.isConfirmed) return;

  try {
    const isNewImage = index >= product.existingExtraImages.length;
    const imageIndex = isNewImage ? index - product.existingExtraImages.length : index;

    if (isNewImage) {
      URL.revokeObjectURL(product.extraImagesPreviews[imageIndex]);

      setProduct(prev => ({
        ...prev,
        extraImages: prev.extraImages.filter((_, i) => i !== imageIndex),
        extraImagesPreviews: prev.extraImagesPreviews.filter((_, i) => i !== imageIndex),
      }));
    } else {
      const imageUrl = product.existingExtraImages[index];
      const imagePath = imageUrl.replace(`${import.meta.env.VITE_API_BASE_URL}/uploads/`, ""); 

      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/products/${id}/delete-image`,
        { imagePath: `/uploads/${imagePath}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProduct(prev => ({
        ...prev,
        existingExtraImages: prev.existingExtraImages.filter((_, i) => i !== index),
      }));

      toast.success("Image deleted successfully");
    }
  } catch (err) {
    console.error("Failed to delete image:", err);
    toast.error(err.response?.data?.error || "Failed to delete image");
  }
};

  const removeMainImage = () => {
    setProduct(prev => ({
      ...prev,
      existingImage: "",
      image: null
    }));
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
      formData.append("originalPrice", product.originalPrice || product.price);
      formData.append("discountPercentage", product.discountPercentage || 0);
      formData.append("quantity", product.quantity);
      formData.append("category", product.category);
      formData.append("brand", product.brand || "");
      formData.append("sku", product.sku || "");
      formData.append("weight", product.weight || "");
      formData.append("dimensions", JSON.stringify(product.dimensions));
      formData.append("warrantyInformation", product.warrantyInformation || "");
      formData.append("shippingInformation", product.shippingInformation || "");
      formData.append("availabilityStatus", product.availabilityStatus || "In Stock");
      formData.append("returnPolicy", product.returnPolicy || "");
      formData.append("minimumOrderQuantity", product.minimumOrderQuantity || 1);
      formData.append("tags", product.tags.join(",") || "");

      if (product.image) {
        formData.append("image", product.image);
      }

      product.extraImages.forEach((file) => {
        formData.append("extraImages", file);
      });

      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true
        }
      );

      setSuccessMsg("✅ Product updated successfully");
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Edit Product</h2>
        <button
          onClick={() => navigate("/seller/my-products")}
          className="text-blue-600 hover:text-blue-800"
        >
          Back to My Products
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-lg">
          <span className="font-medium">⚠️ Error!</span> {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 mb-6 bg-green-100 text-green-700 rounded-lg">
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
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="title"
                placeholder="Enter product name"
                value={product.title}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="price"
                  placeholder="0.00"
                  value={product.price}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-10"
                  min="0.01"
                  step="0.01"
                  required
                />
                <span className="absolute left-3 top-3 text-gray-500">$</span>
              </div>
            </div>

            {/* Original Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original Price ($)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="originalPrice"
                  placeholder="Original price"
                  value={product.originalPrice}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-10"
                  min="0.01"
                  step="0.01"
                />
                <span className="absolute left-3 top-3 text-gray-500">$</span>
              </div>
            </div>

            {/* Discount Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Percentage (%)
              </label>
              <input
                type="number"
                name="discountPercentage"
                placeholder="0-100"
                value={product.discountPercentage}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="100"
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                value={product.quantity}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={product.category}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                placeholder="Product brand"
                value={product.brand}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* SKU removed: cannot be changed during edit */}

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (g)
              </label>
              <input
                type="number"
                name="weight"
                placeholder="Product weight in grams"
                value={product.weight}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>

            {/* Dimensions */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dimensions (cm)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <input
                    type="number"
                    name="dimensions.width"
                    placeholder="Width"
                    value={product.dimensions.width}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="dimensions.height"
                    placeholder="Height"
                    value={product.dimensions.height}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="dimensions.depth"
                    placeholder="Depth"
                    value={product.dimensions.depth}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Warranty Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warranty Information
              </label>
              <input
                type="text"
                name="warrantyInformation"
                placeholder="Warranty details"
                value={product.warrantyInformation}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Shipping Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Information
              </label>
              <input
                type="text"
                name="shippingInformation"
                placeholder="Shipping details"
                value={product.shippingInformation}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Availability Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Availability Status
              </label>
              <select
                name="availabilityStatus"
                value={product.availabilityStatus}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="In Stock">In Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Pre-Order">Pre-Order</option>
                <option value="Backorder">Backorder</option>
              </select>
            </div>

            {/* Return Policy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Return Policy
              </label>
              <input
                type="text"
                name="returnPolicy"
                placeholder="Return policy details"
                value={product.returnPolicy}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Minimum Order Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Quantity
              </label>
              <input
                type="number"
                name="minimumOrderQuantity"
                placeholder="Minimum order quantity"
                value={product.minimumOrderQuantity}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                placeholder="tag1, tag2, tag3"
                value={product.tags.join(", ")}
                onChange={(e) => {
                  const tagsArray = e.target.value.split(",").map(tag => tag.trim());
                  setProduct(prev => ({ ...prev, tags: tagsArray }));
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                placeholder="Product description..."
                value={product.description}
                onChange={handleChange}
                rows="5"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        )}

        {activeTab === "images" && (
          <div className="space-y-6">
            {/* Main Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Image *
                <span className="text-xs text-gray-500 ml-1">(Max 5MB, JPG/PNG)</span>
              </label>
              <div className="flex items-center gap-4">
                {product.existingImage && (
                  <div className="relative">
                    <img
                      src={product.existingImage}
                      alt="Current image"
                      className="w-40 h-40 object-contain rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={removeMainImage}
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      title="Delete image"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 w-40 h-40">
                  <input
                    type="file"
                    name="image"
                    accept="image/jpeg, image/png, image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <svg
                    className="w-10 h-10 text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm text-gray-600">Upload new</span>
                </label>
              </div>
            </div>

            {/* Extra Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extra Images ({product.existingExtraImages.length + product.extraImagesPreviews.length}/5)
                <span className="text-xs text-gray-500 ml-1">(Max 5MB each, JPG/PNG)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {/* Display existing images */}
                {product.existingExtraImages.map((img, idx) => (
                  <div key={`existing-${idx}`} className="relative group">
                    <img
                      src={img}
                      alt={`Extra image ${idx + 1}`}
                      className="w-full h-28 object-contain rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete image"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Display new image previews */}
                {product.extraImagesPreviews.map((img, idx) => (
                  <div key={`new-${idx}`} className="relative group">
                    <img
                      src={img}
                      alt={`New image ${idx + 1}`}
                      className="w-full h-28 object-contain rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraImage(product.existingExtraImages.length + idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {product.existingExtraImages.length + product.extraImagesPreviews.length < 5 && (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <input
                    type="file"
                    name="extraImages"
                    multiple
                    accept="image/jpeg, image/png, image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm text-gray-600">Add extra images</span>
                </label>
              )}
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
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-lg text-white font-medium flex items-center ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                } transition-colors`}
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
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}