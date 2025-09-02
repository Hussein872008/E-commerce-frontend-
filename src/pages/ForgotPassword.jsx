import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, clearError, clearSuccess } from '../redux/authSlice';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const { isLoading, error, success } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    const error = validateEmail(value);
    setFieldError(error);
    dispatch(clearError());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const error = validateEmail(email);
    setFieldError(error);
    
    if (error) {
      toast.error(error);
      return;
    }
    
    dispatch(clearError());
    dispatch(clearSuccess());
    
    dispatch(forgotPassword(email))
      .unwrap()
      .then((msg) => {
        toast.success(msg);
      })
      .catch((err) => {
        toast.error(err);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8 transition-all duration-500">
      <div className="max-w-md w-full space-y-8 bg-white/95 p-10 rounded-3xl shadow-2xl backdrop-blur-md animate-fadeIn border border-gray-100">
        <div className="text-center">
          <h2 className="mt-6 text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm transition-all duration-300">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email to receive a password reset link
          </p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow animate-fadeIn transition-all duration-300 flex items-start" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow animate-shake transition-all duration-300 flex items-start" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 ${
                  fieldError ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your email address"
                value={email}
                onChange={handleChange}
                disabled={isLoading}
              />
              {fieldError && (
                <div className="text-red-600 text-xs mt-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {fieldError}
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99]
                ${isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}
                focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-600 mt-6 pt-4 border-t border-gray-200">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}