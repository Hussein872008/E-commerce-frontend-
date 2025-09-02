import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, clearError, clearSuccess } from '../redux/authSlice';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error, success } = useSelector((state) => state.auth);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // إذا لم يوجد توكن في الرابط، أظهر رسالة ودية فقط
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-center border border-gray-100 max-w-md w-full mx-4">
          <div className="bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Invalid Link</h2>
          <p className="text-gray-700 mb-4">No reset token found. Please use the link sent to your email.</p>
          <button 
            onClick={() => navigate('/forgot-password')} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  const validateField = (name, value) => {
    let message = "";

    if (!value.trim()) {
      message = "This field is required";
    } else if (name === "password") {
      if (value.length < 8) {
        message = "Password must be at least 8 characters";
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        message = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
      }
    } else if (name === "passwordConfirm") {
      if (value !== password) {
        message = "Passwords do not match";
      }
    }

    return message;
  };

  const handleChange = (field, value) => {
    if (field === 'password') {
      setPassword(value);
      const error = validateField('password', value);
      setFieldErrors(prev => ({ ...prev, password: error }));
      
      // Also validate confirmation if it's already set
      if (passwordConfirm) {
        const confirmError = validateField('passwordConfirm', passwordConfirm);
        setFieldErrors(prev => ({ ...prev, passwordConfirm: confirmError }));
      }
    } else {
      setPasswordConfirm(value);
      const error = validateField('passwordConfirm', value);
      setFieldErrors(prev => ({ ...prev, passwordConfirm: error }));
    }
    
    dispatch(clearError());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(clearSuccess());
    
    // Validate both fields
    const passwordError = validateField('password', password);
    const confirmError = validateField('passwordConfirm', passwordConfirm);
    
    setFieldErrors({
      password: passwordError,
      passwordConfirm: confirmError
    });
    
    if (passwordError || confirmError) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    dispatch(resetPassword({ token, password, passwordConfirm }))
      .unwrap()
      .then((msg) => {
        toast.success(msg);
        setTimeout(() => navigate('/login'), 2000);
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
          <p className="mt-2 text-sm text-gray-600">Enter your new password below</p>
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
          <div className="rounded-md shadow-sm space-y-5">
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                className={`w-full px-4 py-3 border rounded-xl pr-12 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 ${
                  fieldErrors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="New Password (min 8 characters)"
                value={password}
                onChange={(e) => handleChange('password', e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-10 text-gray-500 hover:text-blue-700 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
              {fieldErrors.password && (
                <div className="text-red-600 text-xs mt-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {fieldErrors.password}
                </div>
              )}
            </div>
            
            <div className="relative">
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type={showPasswordConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                className={`w-full px-4 py-3 border rounded-xl pr-12 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 ${
                  fieldErrors.passwordConfirm ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Confirm Password (min 8 characters)"
                value={passwordConfirm}
                onChange={(e) => handleChange('passwordConfirm', e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-10 text-gray-500 hover:text-blue-700 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
                onClick={() => setShowPasswordConfirm((v) => !v)}
              >
                {showPasswordConfirm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
              {fieldErrors.passwordConfirm && (
                <div className="text-red-600 text-xs mt-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {fieldErrors.passwordConfirm}
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99] ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              } focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting...
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}