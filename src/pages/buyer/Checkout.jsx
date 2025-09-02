import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCart, clearCart } from '../../redux/cart.slice';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { createOrder } from '../../redux/orders.slice';
import { FiArrowLeft, FiShoppingBag, FiTruck, FiCreditCard, FiCheck } from 'react-icons/fi';

const Checkout = () => {
  const { items, total } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const darkMode = useSelector(state => state.theme.darkMode);
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
    // التحقق الفوري
    let error = '';
    if (name === 'address' && !value) error = 'Address is required';
    if (name === 'city' && !value) error = 'City is required';
    if (name === 'phone' && !value) error = 'Phone number is required';
    if (name === 'phone' && value && !/^[0-9]{10,15}$/.test(value)) error = 'Invalid phone number';
    if (name === 'postalCode' && value && !/^[0-9]{5,6}$/.test(value)) error = 'Postal code must be 5 to 6 digits';
    setShippingErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    setCardInfo((prev) => ({ ...prev, [name]: value }));
    // التحقق الفوري
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
      if (!shippingInfo.phone) errors.phone = 'Phone number is required';
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
    // التحقق من جميع البيانات قبل إنشاء الطلب
    const errors = [];
    if (!shippingInfo.address) errors.push('Address is required');
    if (!shippingInfo.city) errors.push('City is required');
    if (!shippingInfo.phone) errors.push('Phone number is required');
    if (shippingInfo.phone && !/^[0-9]{10,15}$/.test(shippingInfo.phone)) errors.push('Invalid phone number');
    if (shippingInfo.postalCode && !/^[0-9]{5,6}$/.test(shippingInfo.postalCode)) errors.push('Postal code must be 5 to 6 digits');
    if (paymentMethod === 'card') {
      if (!cardInfo.cardNumber) errors.push('Card number is required');
      if (cardInfo.cardNumber && !/^[0-9]{13,19}$/.test(cardInfo.cardNumber)) errors.push('Card number must be 13-19 digits');
    }
    if (items.length === 0) errors.push('Shopping cart is empty');
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
      setConfirmErrors([error.message || 'Failed to create order']);
    } finally {
      setLoading(false);
    }
  };

  // تأثيرات الحركة للخطوات
  const stepVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: 50, transition: { duration: 0.3 } }
  };

  return (
    <div className={`min-h-screen py-6 px-4 transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-800'}`}>
      <div className="container mx-auto max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-6"
        >
          <button 
            onClick={() => navigate(-1)} 
            className={`p-2 rounded-full mr-3 transition-all duration-200 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-white'}`}
          >
            <FiArrowLeft className={`text-xl ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} />
          </button>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Checkout</h1>
        </motion.div>

        {/* Stepper - تصميم متجاوب */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center w-full max-w-md">
            {/* Step 1 */}
            <div className={`flex flex-col items-center flex-1 ${currentStep === 1 ? (darkMode ? 'text-green-300' : 'text-green-600') : (currentStep > 1 ? (darkMode ? 'text-green-400' : 'text-green-500') : (darkMode ? 'text-gray-400' : 'text-gray-400'))}`}>
              <div className={`rounded-full h-10 w-10 flex items-center justify-center relative ${currentStep === 1 ? (darkMode ? 'bg-green-700 text-white' : 'bg-green-600 text-white') : (currentStep > 1 ? (darkMode ? 'bg-green-800' : 'bg-green-500 text-white') : (darkMode ? 'bg-gray-800' : 'bg-gray-200'))}`}>
                {currentStep > 1 ? <FiCheck className="text-lg" /> : '1'}
              </div>
              <div className="text-xs mt-2 text-center hidden sm:block">Shipping Info</div>
            </div>
            
            <div className={`flex-1 h-1 mx-2 ${currentStep > 1 ? (darkMode ? 'bg-green-700' : 'bg-green-500') : (darkMode ? 'bg-gray-700' : 'bg-gray-300')}`}></div>
            
            {/* Step 2 */}
            <div className={`flex flex-col items-center flex-1 ${currentStep === 2 ? (darkMode ? 'text-green-300' : 'text-green-600') : (currentStep > 2 ? (darkMode ? 'text-green-400' : 'text-green-500') : (darkMode ? 'text-gray-400' : 'text-gray-400'))}`}>
              <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep === 2 ? (darkMode ? 'bg-green-700 text-white' : 'bg-green-600 text-white') : (currentStep > 2 ? (darkMode ? 'bg-green-800' : 'bg-green-500 text-white') : (darkMode ? 'bg-gray-800' : 'bg-gray-200'))}`}>
                {currentStep > 2 ? <FiCheck className="text-lg" /> : '2'}
              </div>
              <div className="text-xs mt-2 text-center hidden sm:block">Payment Method</div>
            </div>
            
            <div className={`flex-1 h-1 mx-2 ${currentStep > 2 ? (darkMode ? 'bg-green-700' : 'bg-green-500') : (darkMode ? 'bg-gray-700' : 'bg-gray-300')}`}></div>
            
            {/* Step 3 */}
            <div className={`flex flex-col items-center flex-1 ${currentStep === 3 ? (darkMode ? 'text-green-300' : 'text-green-600') : (darkMode ? 'text-gray-400' : 'text-gray-400')}`}>
              <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep === 3 ? (darkMode ? 'bg-green-700 text-white' : 'bg-green-600 text-white') : (darkMode ? 'bg-gray-800' : 'bg-gray-200')}`}>3</div>
              <div className="text-xs mt-2 text-center hidden sm:block">Confirm Order</div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Shipping Info */}
          {currentStep === 1 && (
            <motion.div 
              key="step1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`rounded-xl shadow-lg p-6 mb-6 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}
            >
              <div className="flex items-center mb-4">
                <FiTruck className={`text-xl mr-2 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                <h2 className={`text-xl font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Shipping Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Address</label>
                  <input 
                    type="text" 
                    name="address" 
                    value={shippingInfo.address} 
                    onChange={handleInputChange} 
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all ${darkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white border-gray-300'}`} 
                    required 
                    placeholder="Enter your full address"
                  />
                  {shippingErrors.address && <div className="text-red-500 text-xs mt-1">{shippingErrors.address}</div>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>City</label>
                    <input 
                      type="text" 
                      name="city" 
                      value={shippingInfo.city} 
                      onChange={handleInputChange} 
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all ${darkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white border-gray-300'}`} 
                      required 
                      placeholder="City"
                    />
                    {shippingErrors.city && <div className="text-red-500 text-xs mt-1">{shippingErrors.city}</div>}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Postal Code</label>
                    <input 
                      type="text" 
                      name="postalCode" 
                      value={shippingInfo.postalCode} 
                      onChange={handleInputChange} 
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all ${darkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white border-gray-300'}`} 
                      placeholder="Optional"
                    />
                    {shippingErrors.postalCode && <div className="text-red-500 text-xs mt-1">{shippingErrors.postalCode}</div>}
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={shippingInfo.phone} 
                    onChange={handleInputChange} 
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all ${darkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white border-gray-300'}`} 
                    required 
                    placeholder="Phone number for contact"
                  />
                  {shippingErrors.phone && <div className="text-red-500 text-xs mt-1">{shippingErrors.phone}</div>}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Payment Method */}
          {currentStep === 2 && (
            <motion.div 
              key="step2"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`rounded-xl shadow-lg p-6 mb-6 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}
            >
              <div className="flex items-center mb-4">
                <FiCreditCard className={`text-xl mr-2 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                <h2 className={`text-xl font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Payment Method</h2>
              </div>
              
              <div className="space-y-4">
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'card' ? (darkMode ? 'border-green-500 bg-green-900/20' : 'border-green-500 bg-green-50') : (darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="cardPayment" 
                      name="paymentMethod" 
                      value="card" 
                      checked={paymentMethod === 'card'} 
                      onChange={() => setPaymentMethod('card')} 
                      className="h-4 w-4 text-green-600 focus:ring-green-500" 
                    />
                    <label htmlFor="cardPayment" className={`ml-2 block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Credit Card</label>
                  </div>
                  
                  {paymentMethod === 'card' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 space-y-3"
                    >
                      <div>
                        <input 
                          type="text" 
                          name="cardNumber" 
                          placeholder="Card Number (digits only)" 
                          value={cardInfo.cardNumber} 
                          onChange={handleCardInputChange} 
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all ${darkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white border-gray-300'}`} 
                        />
                        {paymentErrors.cardNumber && <div className="text-red-500 text-xs mt-1">{paymentErrors.cardNumber}</div>}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="month" 
                          name="expiryDate" 
                          placeholder="Expiry Date (MM/YY)" 
                          value={cardInfo.expiryDate} 
                          onChange={handleCardInputChange} 
                          className={`p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all ${darkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white border-gray-300'}`} 
                        />
                        <input 
                          type="text" 
                          name="cvv" 
                          placeholder="CVV" 
                          value={cardInfo.cvv} 
                          onChange={handleCardInputChange} 
                          className={`p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all ${darkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white border-gray-300'}`} 
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
                
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'cash' ? (darkMode ? 'border-green-500 bg-green-900/20' : 'border-green-500 bg-green-50') : (darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="cashPayment" 
                      name="paymentMethod" 
                      value="cash" 
                      checked={paymentMethod === 'cash'} 
                      onChange={() => setPaymentMethod('cash')} 
                      className="h-4 w-4 text-green-600 focus:ring-green-500" 
                    />
                    <label htmlFor="cashPayment" className={`ml-2 block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Cash on Delivery</label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirm Order */}
          {currentStep === 3 && (
            <motion.div 
              key="step3"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`rounded-xl shadow-lg p-6 mb-6 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}
            >
              <div className="flex items-center mb-4">
                <FiCheck className={`text-xl mr-2 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                <h2 className={`text-xl font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Confirm Order</h2>
              </div>
              
              {confirmErrors.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg"
                >
                  {confirmErrors.map((err, idx) => (
                    <div key={idx} className="text-red-600 text-sm mb-1 flex items-center">
                      <span className="ml-1">•</span> {err}
                    </div>
                  ))}
                </motion.div>
              )}
              
              <div className="mb-6">
                <div className={`font-semibold mb-2 flex items-center ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                  <FiTruck className="ml-2" /> Shipping Info:
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="mb-1">Address: {shippingInfo.address}</div>
                  <div className="mb-1">City: {shippingInfo.city}</div>
                  <div className="mb-1">Postal Code: {shippingInfo.postalCode || '-'}</div>
                  <div>Phone: {shippingInfo.phone}</div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className={`font-semibold mb-2 flex items-center ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                  <FiCreditCard className="ml-2" /> Payment Method:
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div>{paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery'}</div>
                  {paymentMethod === 'card' && <div>Card Number: ****{cardInfo.cardNumber.slice(-4)}</div>}
                </div>
              </div>
              
              <div className="mb-4">
                <div className={`font-semibold mb-2 flex items-center ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                  <FiShoppingBag className="ml-2" /> Order Summary:
                </div>
                <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  {items.map((item) => (
                    <div key={item._id} className="flex items-center p-3 border-b last:border-b-0">
                      <img 
                        src={item.product.image} 
                        alt={item.product.title} 
                        className="w-12 h-12 object-cover rounded" 
                        onError={e => { e.target.src = '/placeholder-image.webp'; }} 
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium">{item.product.title}</div>
                        <div className="text-xs opacity-70">Quantity: {item.quantity}</div>
                      </div>
                      <div className="font-bold">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                  <div className={`p-3 border-t font-bold text-lg flex justify-between ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <span>Total:</span>
                    <span className={`${darkMode ? 'text-green-300' : 'text-green-600'}`}>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* أزرار التنقل */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 mt-6">
          <div className="w-full sm:w-auto">
            {currentStep > 1 ? (
              <button 
                onClick={handlePrevStep} 
                className={`w-full sm:w-auto px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center ${darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                <FiArrowLeft className="mr-2" /> Previous
              </button>
            ) : (
              <Link 
                to="/store" 
                className={`w-full sm:w-auto px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center ${darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                <FiArrowLeft className="mr-2" /> Back to Store
              </Link>
            )}
          </div>
          
          <div className="w-full sm:w-auto">
            {currentStep < 3 ? (
              <button 
                onClick={handleNextStep} 
                className="w-full sm:w-auto px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Next
              </button>
            ) : (
              <button 
                onClick={handlePlaceOrder} 
                disabled={loading || items.length === 0}
                className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center ${loading || items.length === 0 ? (darkMode ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed') : 'bg-green-500 text-white hover:bg-green-600'}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Confirm Order'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;