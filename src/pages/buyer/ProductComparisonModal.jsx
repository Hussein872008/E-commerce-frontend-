import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ProductComparisonModal = ({ productIds, onClose }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const responses = await Promise.all(
                    productIds.map(id =>
                        axios.get(`/api/products/${id}`)
                    )
                );
                setProducts(responses.map(res => res.data));
            } catch (err) {
                console.error('Failed to fetch products:', err);
                setError('Failed to load product details');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [productIds]);

    const getCommonFeatures = () => {
        if (products.length === 0) return [];

        const allFeatures = {};
        products.forEach(product => {
            product.features?.forEach(feature => {
                if (!allFeatures[feature.name]) {
                    allFeatures[feature.name] = new Set();
                }
                allFeatures[feature.name].add(feature.value);
            });
        });

        return Object.entries(allFeatures)
            .filter(([_, values]) => values.size > 1)
            .map(([name]) => name);
    };

    if (error) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Error</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <FaTimes />
                        </button>
                    </div>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold">Compare Products</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FaTimes />
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto p-4">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Feature
                                    </th>
                                    {products.map(product => (
                                        <th key={product._id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {product.title}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        Image
                                    </td>
                                    {products.map(product => (
                                        <td key={`img-${product._id}`} className="px-6 py-4 whitespace-nowrap">
                                            <div className="relative h-40">
                                                <img
                                                    src={
                                                        product.image?.startsWith('http')
                                                            ? product.image
                                                            : product.image?.includes('/uploads/')
                                                                                ? product.image
                : `/uploads/${product.image}`
                                                    }
                                                    alt={product.title}
                                                    className="h-full w-full object-contain"
                                                    onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                                                />
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        Price
                                    </td>
                                    {products.map(product => (
                                        <td key={`price-${product._id}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {(product.discountPercentage && product.originalPrice) ? (
                                                <>
                                                    <span className="text-green-600 font-bold">
                                                        ${(
                                                            product.originalPrice - (product.originalPrice * product.discountPercentage / 100)
                                                        ).toFixed(2)}
                                                    </span>
                                                    <span className="ml-2 text-xs text-gray-400 line-through">
                                                        ${product.originalPrice.toFixed(2)}
                                                    </span>
                                                    <span className="ml-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                                        {Math.round(product.discountPercentage)}% OFF
                                                    </span>
                                                </>
                                            ) : product.originalPrice ? (
                                                <span className="text-green-600 font-bold">
                                                    ${product.originalPrice.toFixed(2)}
                                                </span>
                                            ) : (
                                                <span className="text-green-600 font-bold">
                                                    ${product.price?.toFixed(2)}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                                {getCommonFeatures().map(feature => (
                                    <tr key={feature}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {feature}
                                        </td>
                                        {products.map(product => (
                                            <td key={`${feature}-${product._id}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {product.features?.find(f => f.name === feature)?.value || '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductComparisonModal;