import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, verifyToken, clearError, setLoading } from "../redux/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    success,
    role
  } = useSelector((state) => state.auth);
  const darkMode = useSelector(state => state.theme.darkMode);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && role) {
      const redirectPath = role === 'admin' ? '/admin-dashboard'
        : role === 'seller' ? '/seller'
        : '/store';
      navigate(redirectPath);
    }
  }, [isAuthenticated, role, navigate, user]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const validateField = (name, value) => {
    let message = "";
    if (!value.trim()) {
      message = "This field is required";
    } else if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        message = "Please enter a valid email address";
      }
    }
    return message;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const message = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: message }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (touchedFields[name]) {
      const message = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: message }));
    } else {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    dispatch(clearError());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouchedFields(allTouched);
    const errors = {};
    Object.keys(formData).forEach(key => {
      const message = validateField(key, formData[key]);
      if (message) errors[key] = message;
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the errors in the form");
      return;
    }
    setSubmitError(null);

    (async () => {
      setIsSubmitting(true);
      try {
        await dispatch(loginUser(formData)).unwrap();
        toast.success("Login successful");
      } catch (err) {
        const message = typeof err === 'string' ? err : (err?.message || 'Email or Password is incorrect');
        setSubmitError(message);
      } finally {
        dispatch(setLoading(false));
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br py-12 px-4 sm:px-6 lg:px-8 transition-all duration-500 ${darkMode ? 'from-gray-900 via-gray-800 to-gray-900' : 'from-blue-50 via-white to-purple-50'}`}>
      <div className={`max-w-md w-full space-y-8 p-10 rounded-3xl shadow-2xl backdrop-blur-md animate-fadeIn border ${darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-100'}`}>
        <div className="text-center">
          <h2 className={`mt-6 text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent drop-shadow-sm transition-all duration-300 ${darkMode ? 'from-blue-200 to-purple-400' : 'from-blue-600 to-purple-600'}`}>Welcome Back</h2>
          <p className={`mt-2 text-sm ${darkMode ? 'text-blue-200' : 'text-gray-500'}`}>Sign in to continue to your account</p>
        </div>

        {(submitError || (error && error !== "No token found")) ? (
          <div
            className={`p-3 border text-center text-sm mb-2 ${darkMode ? 'bg-red-900 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}
            role="alert"
            aria-live="assertive"
          >
            <span className="font-medium">{submitError || error}</span>
          </div>
        ) : null}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-5">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-blue-100' : 'text-gray-700'}`}>Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 ${darkMode ? 'dark:bg-gray-800 dark:text-blue-100' : ''} ${fieldErrors.email ? (darkMode ? 'border-red-700' : 'border-red-500') : (darkMode ? 'border-gray-700' : 'border-gray-300')}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={fieldErrors.email ? true : false}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email && (
                <div id="email-error" role="alert" aria-live="polite" className={`text-xs mt-2 flex items-center ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {fieldErrors.email}
                </div>
              )}
            </div>

            <div className="relative">
              <label htmlFor="password" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-blue-100' : 'text-gray-700'}`}>Password</label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className={`w-full px-4 py-3 border rounded-xl pr-12 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 ${darkMode ? 'dark:bg-gray-800 dark:text-blue-100' : ''} ${fieldErrors.password ? (darkMode ? 'border-red-700' : 'border-red-500') : (darkMode ? 'border-gray-700' : 'border-gray-300')}`}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={fieldErrors.password ? true : false}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                className={`absolute right-3 top-10 transition-colors duration-200 p-1 rounded-full ${darkMode ? 'text-blue-200 hover:text-blue-400 hover:bg-gray-800' : 'text-gray-500 hover:text-blue-700 hover:bg-gray-100'}`}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
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
                <div id="password-error" role="alert" aria-live="polite" className={`text-xs mt-2 flex items-center ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {fieldErrors.password}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className={`h-4 w-4 text-blue-600 focus:ring-blue-500 rounded ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-300'}`}
              />
              <label htmlFor="remember-me" className={`ml-2 text-sm ${darkMode ? 'text-blue-100' : 'text-gray-900'}`}>Remember me</label>
            </div>
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className={`font-medium transition-colors duration-200 underline underline-offset-2 ${darkMode ? 'text-blue-200 hover:text-blue-400' : 'text-blue-600 hover:text-blue-500'}`}
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className={`group relative w-full flex justify-center items-center py-3 px-4 rounded-xl text-white font-medium shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99] ${isLoading ? (darkMode ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-400 cursor-not-allowed') : (darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900 hover:from-blue-800 hover:to-purple-800' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700')}`}
            >
              {(isSubmitting || isLoading) ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>

        <div className={`text-center text-sm mt-6 pt-4 border-t ${darkMode ? 'text-blue-100 border-gray-700' : 'text-gray-600 border-gray-200'}`}>
          Don't have an account?{' '}
          <Link to="/register" className={`font-medium transition-colors duration-200 underline underline-offset-2 ${darkMode ? 'text-indigo-400 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800'}`}>Register now</Link>
        </div>
      </div>
    </div>
  );
}