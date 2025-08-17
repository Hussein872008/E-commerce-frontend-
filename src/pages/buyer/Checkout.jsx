import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCart, clearCart } from '../../redux/cart.slice';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { createOrder } from '../../redux/orders.slice';

const Checkout = () => {
  const { items, total } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    postalCode: '',
    phone: '',
  });
  const [shippingErrors, setShippingErrors] = useState({});
  const [paymentErrors, setPaymentErrors] = useState({});
  const [confirmErrors, setConfirmErrors] = useState([]);

  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  useEffect(() => {
    if (user) {
      dispatch(fetchCart());
    }
  }, [user, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
    // Instant validation
    let error = '';
    if (name === 'address' && !value) error = 'Address is required';
    if (name === 'city' && !value) error = 'City is required';
    if (name === 'phone' && !value) error = 'Phone is required';
    if (name === 'phone' && value && !/^[0-9]{10,15}$/.test(value)) error = 'Invalid phone number';
    if (name === 'postalCode' && value && !/^[0-9]{5,6}$/.test(value)) error = 'Postal code must be 5 to 6 digits';
    setShippingErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    setCardInfo((prev) => ({ ...prev, [name]: value }));
    // Instant validation
    let error = '';
    if (name === 'cardNumber' && value && !/^[0-9]{13,19}$/.test(value)) error = 'Card number must be 13-19 digits';
    setPaymentErrors(prev => ({ ...prev, [name]: error }));
  };

const validateCardNumber = (number) => /^\d{13,19}$/.test(number);
const validatePostalCode = (code) => {
  return !code || /^\d{5,6}$/.test(code);
};
  const handleNextStep = () => {
    if (currentStep === 1) {
      const errors = {};
      if (!shippingInfo.address) errors.address = 'Address is required';
      if (!shippingInfo.city) errors.city = 'City is required';
      if (!shippingInfo.phone) errors.phone = 'Phone is required';
      if (shippingInfo.phone && !/^[0-9]{10,15}$/.test(shippingInfo.phone)) errors.phone = 'Invalid phone number';
      if (shippingInfo.postalCode && !/^[0-9]{5,6}$/.test(shippingInfo.postalCode)) errors.postalCode = 'Postal code must be 5 to 6 digits';
      setShippingErrors(errors);
      if (Object.keys(errors).length > 0) return;
    }
    if (currentStep === 2 && paymentMethod === 'card') {
      const errors = {};
      if (!cardInfo.cardNumber) errors.cardNumber = 'Card number is required';
      if (cardInfo.cardNumber && !/^[0-9]{13,19}$/.test(cardInfo.cardNumber)) errors.cardNumber = 'Card number must be 13-19 digits';
      setPaymentErrors(errors);
      if (Object.keys(errors).length > 0) return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

const handlePlaceOrder = async () => {
  // Validate all before placing order
  const errors = [];
  if (!shippingInfo.address) errors.push('Address is required');
  if (!shippingInfo.city) errors.push('City is required');
  if (!shippingInfo.phone) errors.push('Phone is required');
  if (shippingInfo.phone && !/^[0-9]{10,15}$/.test(shippingInfo.phone)) errors.push('Invalid phone number');
  if (shippingInfo.postalCode && !/^[0-9]{5,6}$/.test(shippingInfo.postalCode)) errors.push('Postal code must be 5 to 6 digits');
  if (paymentMethod === 'card') {
    if (!cardInfo.cardNumber) errors.push('Card number is required');
    if (cardInfo.cardNumber && !/^[0-9]{13,19}$/.test(cardInfo.cardNumber)) errors.push('Card number must be 13-19 digits');
  }
  if (items.length === 0) errors.push('Your cart is empty');
  setConfirmErrors(errors);
  if (errors.length > 0) return;

  setLoading(true);
  try {
    const orderItems = items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
    }));
    const orderResult = await dispatch(
      createOrder({
        items: orderItems,
        shippingAddress: shippingInfo,
        totalAmount: total,
        paymentMethod: paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery',
        cardNumber: paymentMethod === 'card' ? cardInfo.cardNumber : undefined,
      })
    );
    if (createOrder.fulfilled.match(orderResult)) {
      setConfirmErrors([]);
      dispatch(clearCart());
      navigate(`/buyer/orders`);
    } else {
      setConfirmErrors([orderResult.payload || 'Failed to create order']);
    }
  } catch (error) {
    setConfirmErrors([error.message || 'Failed to place order']);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold mb-6 text-green-700">Checkout</motion.h1>

      {/* Stepper */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center">
          <div className={`flex items-center ${currentStep === 1 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center ${currentStep === 1 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>1</div>
            <div className="ml-2">Shipping Info</div>
          </div>
          <div className="mx-4 h-px w-16 bg-gray-300"></div>
          <div className={`flex items-center ${currentStep === 2 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center ${currentStep === 2 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>2</div>
            <div className="ml-2">Payment</div>
          </div>
          <div className="mx-4 h-px w-16 bg-gray-300"></div>
          <div className={`flex items-center ${currentStep === 3 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center ${currentStep === 3 ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>3</div>
            <div className="ml-2">Confirm</div>
          </div>
        </div>
      </div>

      {/* Step 1: Shipping Info */}
      {currentStep === 1 && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Shipping Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" name="address" value={shippingInfo.address} onChange={handleInputChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500" required />
              {shippingErrors.address && <div className="text-red-500 text-xs mt-1">{shippingErrors.address}</div>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" name="city" value={shippingInfo.city} onChange={handleInputChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500" required />
                {shippingErrors.city && <div className="text-red-500 text-xs mt-1">{shippingErrors.city}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input type="text" name="postalCode" value={shippingInfo.postalCode} onChange={handleInputChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500" />
                {shippingErrors.postalCode && <div className="text-red-500 text-xs mt-1">{shippingErrors.postalCode}</div>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" name="phone" value={shippingInfo.phone} onChange={handleInputChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500" required />
              {shippingErrors.phone && <div className="text-red-500 text-xs mt-1">{shippingErrors.phone}</div>}
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 2: Payment Method */}
      {currentStep === 2 && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Payment Method</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input type="radio" id="cardPayment" name="paymentMethod" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="h-4 w-4 text-green-600 focus:ring-green-500" />
              <label htmlFor="cardPayment" className="mr-2 block text-sm font-medium text-gray-700">Credit Card</label>
            </div>
            {paymentMethod === 'card' && (
              <div className="space-y-3 mt-3">
                <input type="text" name="cardNumber" placeholder="Card Number (digits only)" value={cardInfo.cardNumber} onChange={handleCardInputChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500" />
                {paymentErrors.cardNumber && <div className="text-red-500 text-xs mt-1">{paymentErrors.cardNumber}</div>}
                <input type="month" name="expiryDate" placeholder="Expiry Date (MM/YYYY)" value={cardInfo.expiryDate} onChange={handleCardInputChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500" />
                <input type="text" name="cvv" placeholder="CVV" value={cardInfo.cvv} onChange={handleCardInputChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500" />
              </div>
            )}
            <div className="flex items-center">
              <input type="radio" id="cashPayment" name="paymentMethod" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="h-4 w-4 text-green-600 focus:ring-green-500" />
              <label htmlFor="cashPayment" className="mr-2 block text-sm font-medium text-gray-700">Cash on Delivery</label>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 3: Confirm Order */}
      {currentStep === 3 && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Confirm Order</h2>
          {confirmErrors.length > 0 && (
            <div className="mb-4">
              {confirmErrors.map((err, idx) => (
                <div key={idx} className="text-red-500 text-sm mb-1">{err}</div>
              ))}
            </div>
          )}
          <div className="mb-4">
            <div className="font-semibold mb-2">Shipping Info:</div>
            <div>Address: {shippingInfo.address}</div>
            <div>City: {shippingInfo.city}</div>
            <div>Postal Code: {shippingInfo.postalCode || '-'}</div>
            <div>Phone: {shippingInfo.phone}</div>
          </div>
          <div className="mb-4">
            <div className="font-semibold mb-2">Payment Method:</div>
            <div>{paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery'}</div>
            {paymentMethod === 'card' && <div>Card Number: ****{cardInfo.cardNumber.slice(-4)}</div>}
          </div>
          <div className="mb-4">
            <div className="font-semibold mb-2">Order Summary:</div>
            {items.map((item) => (
              <div key={item._id} className="flex items-center py-2 border-b">
                <img src={item.product.image} alt={item.product.title} className="w-10 h-10 object-cover rounded" onError={e => { e.target.src = '/placeholder-product.png'; }} />
                <div className="ml-2 flex-1">
                  <span>{item.product.title}</span>
                  <span className="text-xs text-gray-500 ml-2">Qty: {item.quantity}</span>
                </div>
                <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="mt-2 font-bold">Total: ${total.toFixed(2)}</div>
          </div>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-4">
        {currentStep > 1 && (
          <button onClick={handlePrevStep} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Previous</button>
        )}
        {currentStep < 3 ? (
          <button onClick={handleNextStep} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Next</button>
        ) : (
          <button onClick={handlePlaceOrder} disabled={loading || items.length === 0} className={`px-4 py-2 rounded font-medium ${loading || items.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>{loading ? 'Processing...' : 'Place Order'}</button>
        )}
      </div>
      <Link to="/store" className="block text-center mt-6 text-green-600 hover:underline">Back to Store</Link>
    </div>
  );
};

export default Checkout;
