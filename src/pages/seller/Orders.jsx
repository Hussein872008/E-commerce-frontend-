



import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api, { setAuthToken } from "../../utils/api";
import { updateOrderStatus } from "../../redux/adminSlice";
import { FiRefreshCw } from "react-icons/fi";

export default function SellerOrders() {
  const dispatch = useDispatch();
  const { updating, updateError } = useSelector(state => state.admin || {});
  const [successMsg, setSuccessMsg] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-dismiss success and error messages
  useEffect(() => {
    let timer;
    if (successMsg) {
      timer = setTimeout(() => setSuccessMsg("") , 3000);
    }
    return () => clearTimeout(timer);
  }, [successMsg]);

  useEffect(() => {
    let timer;
    if (error) {
      timer = setTimeout(() => setError(null), 3000);
    }
    return () => clearTimeout(timer);
  }, [error]);

  const fetchSellerOrders = async () => {
    setLoading(true);
    setError(null);
    try {
  const token = localStorage.getItem("token");
  setAuthToken(token);
  const res = await api.get("/api/orders/seller");
      setOrders(res.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch seller orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerOrders();
  }, []);

  const handleStatusUpdate = (orderId) => {
    dispatch(updateOrderStatus({ orderId, status: "Shipped" }))
      .then((res) => {
        if (!res.error) {
          setSuccessMsg("Order status updated successfully!");
          fetchSellerOrders();
        }
      });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Top Navbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Seller Orders</h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={fetchSellerOrders}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors font-semibold"
            disabled={loading}
            title="Refresh Orders"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh Orders
          </button>
        </div>
      </div>
      {successMsg && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4 font-semibold">
          {successMsg}
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md border border-gray-200 p-5 flex flex-col gap-3 animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="h-4 w-32 bg-blue-100 rounded mb-2"></div>
                  <div className="h-3 w-20 bg-gray-100 rounded"></div>
                </div>
                <div className="h-6 w-24 bg-gray-200 rounded"></div>
              </div>
              <div className="flex flex-col gap-1 mb-2">
                <div className="h-3 w-1/2 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-1/3 bg-gray-100 rounded mb-1"></div>
                <div className="h-3 w-1/4 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-1/2 bg-gray-100 rounded mb-1"></div>
                <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
              </div>
              <div className="mt-2">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="overflow-x-auto">
                  <div className="h-8 w-full bg-gray-100 rounded mb-1"></div>
                  <div className="h-8 w-5/6 bg-gray-100 rounded mb-1"></div>
                  <div className="h-8 w-2/3 bg-gray-100 rounded"></div>
                </div>
              </div>
              <div className="mt-2 text-right">
                <div className="h-6 w-20 bg-blue-100 rounded ml-auto"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl shadow-md border border-gray-200 min-h-[300px]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4m-5 4h18" />
              </svg>
              <h3 className="text-2xl font-bold text-gray-500 mb-2">No Orders Yet</h3>
              <p className="text-gray-400 mb-4">You have not received any orders yet. Orders will appear here once buyers make purchases.</p>
              <button
                onClick={fetchSellerOrders}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-semibold"
              >
                Refresh
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {orders.map(order => {
                  return (
                  <div key={order._id} className="bg-white rounded-xl shadow-md border border-gray-200 p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-blue-700">Order #{order._id}</span>
                        <span
                          className={
                            "ml-2 px-2 py-1 rounded text-xs font-bold inline-block " +
                            (order.status === "Processing"
                              ? "bg-yellow-100 text-yellow-800"
                              : order.status === "Shipped"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "Delivered"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800")
                          }
                        >
                          {order.status}
                        </span>
                      </div>
                      <div>
                        {order.status === "Processing" ? (
                          <button
                            className="px-3 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors text-xs"
                            onClick={() => handleStatusUpdate(order._id)}
                            disabled={updating}
                          >
                            {updating ? "..." : "Mark as Shipped"}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="text-sm text-gray-700"><span className="font-semibold">Buyer:</span> {order.buyer?.name && order.buyer?.name !== '-' ? order.buyer.name : 'Unknown'}</div>
                      <div className="text-sm text-gray-700"><span className="font-semibold">Email:</span> {order.buyer?.email && order.buyer?.email !== '-' ? order.buyer.email : 'Unknown'}</div>
                      <div className="text-sm text-gray-700"><span className="font-semibold">Payment:</span> {order.paymentMethod || "-"} ({order.paymentStatus || "-"})</div>
                      <div className="text-sm text-gray-700"><span className="font-semibold">Shipping:</span> {order.shippingAddress?.address || "-"}, {order.shippingAddress?.city || "-"}</div>
                      <div className="text-sm text-gray-700"><span className="font-semibold">Created:</span> {new Date(order.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="mt-2">
                      <div className="font-semibold mb-1">Products:</div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border rounded">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-2 py-1 text-left">Product</th>
                              <th className="px-2 py-1 text-center">Quantity</th>
                              <th className="px-2 py-1 text-center">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map(item => (
                              <tr key={item.product?._id || item.product} className="border-b">
                                <td className="px-2 py-1 flex items-center gap-2">
                                  <img
                                    src={item.product?.image && typeof item.product.image === "string" && item.product.image.match(/\.(jpg|jpeg|png|webp)$/i)
                                      ? item.product.image
                                      : "/placeholder-image.webp"}
                                    alt={item.product?.title || "Product"}
                                    className="w-8 h-8 rounded object-cover border mr-2"
                                  />
                                  <span className="font-medium">{item.product?.title || "Deleted"}</span>
                                </td>
                                <td className="px-2 py-1 text-center font-bold">{item.quantity}</td>
                                <td className="px-2 py-1 text-center">${item.product?.price?.toFixed(2) || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="text-xs text-gray-600 mt-2 font-bold">Total Products: {order.items.length}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-right font-bold text-lg text-blue-700">Total: ${order.totalAmount?.toFixed(2) || "-"}</div>
                  </div>
                );
                })}
              </div>
              {/* Summary row */}
              <div className="mt-8 bg-gray-100 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between font-bold text-lg">
                <div>Total Orders: {orders.length}</div>
                <div>Total Sales: ${orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2)}</div>
              </div>
              {updateError && <div className="text-red-600 mt-2">{updateError}</div>}
            </>
          )}
        </>
      )}
    </div>
  );
}
