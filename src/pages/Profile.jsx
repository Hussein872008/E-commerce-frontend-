import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from 'framer-motion';
import { logout, updateProfile } from "../redux/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaLock, FaSave, FaSignOutAlt, FaTimes, FaTrash, FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import { deleteAccount } from "../redux/authSlice";
import Swal from 'sweetalert2';

export default function Profile({ open = false, onClose = () => {} }) {
  const { user: currentUser, token } = useSelector((state) => state.auth);
  const darkMode = useSelector(state => state.theme.darkMode);
  const [user, setUser] = useState(currentUser || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    name: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userName = user?.name || '';
  const userEmail = user?.email || '';
  const userRole = user?.role || '';
  const userCreatedAt = user?.createdAt || null;
  const userUpdatedAt = user?.updatedAt || null;

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        name: currentUser.name || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      setUser(null);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const [passwordMatch, setPasswordMatch] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validations, setValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const validatePassword = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
    
    setValidations(checks);
    
    const strength = Object.values(checks).filter(Boolean).length;
    setPasswordStrength(strength);
    
    return strength;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === 'newPassword') {
        validatePassword(value);
        if (prev.confirmPassword) {
          setPasswordMatch(value === prev.confirmPassword);
        }
      }
      
      if (name === 'confirmPassword') {
        setPasswordMatch(value === prev.newPassword);
        if (value === prev.newPassword && value !== '') {
          const button = document.querySelector('#saveButton');
          if (button) {
            button.classList.add('animate-pulse');
            setTimeout(() => button.classList.remove('animate-pulse'), 1000);
          }
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

  if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        setError("Password must be at least 8 characters");
        setLoading(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError("New passwords don't match");
        setLoading(false);
        return;
      }
    }

    try {
      await dispatch(
        updateProfile({
          userId: user?.id,
          token,
          updates: {
            name: formData.name,
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          },
        })
      ).unwrap();

      toast.success("Your profile has been updated successfully");
      setEditMode(false);
    } catch (err) {
      console.error('Update error:', err);
      setError(err?.response?.data?.message || err.message || "Failed to update profile");
      toast.error(err?.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout',
      text: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel',
      confirmButtonColor: darkMode ? '#1d4ed8' : '#2563eb',
      cancelButtonColor: darkMode ? '#374151' : '#6b7280',
      background: darkMode ? '#1f2937' : '#ffffff',
      color: darkMode ? '#e5e7eb' : '#1f2937'
    });

    if (result.isConfirmed) {
      dispatch(logout());
      onClose();
      navigate("/login");
      Swal.fire({
        title: 'Success',
        text: 'Logged out successfully',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: darkMode ? '#1f2937' : '#ffffff',
        color: darkMode ? '#e5e7eb' : '#1f2937'
      });
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    try {
      const password = deleteEmail === user.email ? document.querySelector('#deletePassword').value : null;
      
      if (!password) {
        setError('Please enter your password to delete your account');
        return;
      }

      setLoading(true);
      setError('');

      await dispatch(deleteAccount({ password })).unwrap();

  const modal = document.querySelector('#deleteModal');
  if (modal) {
    modal.classList.add('scale-0', 'opacity-0');
  }

  await Swal.fire({
    title: 'Account deleted',
    text: 'Your account has been deleted successfully.',
    icon: 'success',
    timer: 1500,
    showConfirmButton: false,
    background: darkMode ? '#1f2937' : '#ffffff',
    color: darkMode ? '#e5e7eb' : '#1f2937'
  });

  dispatch(logout());
  onClose();
  window.location.reload();

    } catch (err) {
      console.error('Delete error:', err);
      setLoading(false);
      
      setError(
        err?.response?.data?.message === 'Invalid password'
          ? 'The password you entered is incorrect'
          : err?.response?.data?.message || 'Failed to delete account. Please try again.'
      );
      
      const modal = document.querySelector('#deleteModal');
      if (modal) {
        modal.classList.add('animate-shake');
        setTimeout(() => modal.classList.remove('animate-shake'), 500);
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {open && (
        <div className="fixed inset-0 z-50 pointer-events-auto">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`absolute inset-y-0 right-0 z-50 w-full md:w-96 lg:w-[420px] overflow-y-auto shadow-2xl backdrop-blur-lg ${
              darkMode 
                ? 'bg-gray-900/95 text-gray-100 border-l border-blue-500/20' 
                : 'bg-white/95 text-gray-800 border-l border-gray-200'
            }`}
          >
            <div className={`p-6 flex items-center justify-between ${
              darkMode 
                ? 'bg-gradient-to-r from-blue-800 to-purple-800 text-blue-100 shadow-lg' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
            }`}>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
                <p className="opacity-90 text-sm">Manage your account settings</p>
              </div>
              <div className="flex items-center gap-3">
                <motion.button 
                  onClick={onClose} 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-full transition ${
                    darkMode 
                      ? 'hover:bg-white/10 active:bg-white/20' 
                      : 'hover:bg-white/20 active:bg-white/30'
                  }`} 
                  aria-label="Close profile"
                >
                  <FaTimes />
                </motion.button>
              </div>
            </div>

            <div className="p-6">
              {!user ? (
                <div className={`p-6 rounded-lg text-center ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}>
                  <h3 className="text-xl font-semibold mb-3">Not signed in</h3>
                  <p className="mb-4 opacity-80">Please sign in to access your profile settings.</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => navigate('/login')} className={`px-4 py-2 rounded ${darkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}`}>Login</button>
                    <button onClick={() => navigate('/register')} className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}>Register</button>
                  </div>
                </div>
              ) : (
                <>
                  {error && (
                    <div className={`mb-4 p-3 rounded ${darkMode ? 'bg-red-900/30 border border-red-700 text-red-300' : 'bg-red-100 border border-red-400 text-red-700'}`}>
                      {error}
                    </div>
                  )}

                  {/* Avatar and user info */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center mb-8 gap-6"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl font-extrabold shadow-lg ring-4 transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gradient-to-br from-blue-900 to-purple-900 text-blue-300 ring-blue-500/30' 
                          : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white ring-purple-200'
                      }`}
                    >
                      {(userName || userEmail || '?').charAt(0).toUpperCase()}
                    </motion.div>
                    <div>
                      <motion.h2 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-2xl font-bold mb-1"
                      >
                        {userName}
                      </motion.h2>
                      <motion.p 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={`mb-1 ${darkMode ? 'text-blue-200' : 'text-gray-600'}`}
                      >
                        {userEmail}
                      </motion.p>
                      <motion.span 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-1 ${
                          darkMode 
                            ? 'bg-gradient-to-r from-blue-800/40 to-purple-800/40 text-blue-300 border border-blue-700/30' 
                            : 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {userRole}
                      </motion.span>
                      <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className={`text-xs mt-2 space-y-0.5 ${darkMode ? 'text-blue-300/70' : 'text-gray-500'}`}
                      >
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-green-500' : 'bg-green-400'}`} />
                          <span>Status: <span className={`font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>Active</span></span>
                        </div>
                        {userCreatedAt && (
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-blue-500' : 'bg-blue-400'}`} />
                            <span>Member since {new Date(userCreatedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>

                  {editMode ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className={`block mb-2 ${darkMode ? 'text-blue-200' : 'text-gray-700'}`} htmlFor="name">
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full p-2 border rounded focus:ring-2 focus:border-transparent ${darkMode ? 'bg-gray-900 border-gray-700 text-blue-100 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:ring-green-500'}`}
                          required
                        />
                      </div>

                      {/* Current Password Field */}
                      <div>
                        <label className={`block mb-2 ${darkMode ? 'text-blue-200' : 'text-gray-700'}`} htmlFor="currentPassword">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? "text" : "password"}
                            id="currentPassword"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                              darkMode 
                                ? 'bg-gray-800/50 border-gray-700 text-blue-100 focus:ring-blue-500' 
                                : 'bg-gray-50 border-gray-300 text-gray-800 focus:ring-green-500'
                            }`}
                            placeholder="Required for changes"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition ${
                              darkMode 
                                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        <Link 
                          to="/forgot-password"
                          className={`text-sm mt-1 inline-block hover:underline ${
                            darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          Forgot your password?
                        </Link>
                      </div>

                      {/* New Password Field */}
                      <div>
                        <label className={`block mb-2 ${darkMode ? 'text-blue-200' : 'text-gray-700'}`} htmlFor="newPassword">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                              darkMode 
                                ? 'bg-gray-800/50 border-gray-700 text-blue-100 focus:ring-blue-500' 
                                : 'bg-gray-50 border-gray-300 text-gray-800 focus:ring-green-500'
                            }`}
                            placeholder="Leave blank to keep current"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition ${
                              darkMode 
                                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        
                        {formData.newPassword && (
                          <div className="space-y-3 mt-3">
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map((level) => (
                                <motion.div 
                                  key={level}
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: level <= passwordStrength ? 1 : 0 }}
                                  className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                                    level <= passwordStrength
                                      ? darkMode
                                        ? level <= 2 ? 'bg-red-500' : level <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                                        : level <= 2 ? 'bg-red-500' : level <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                                      : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>

                            {/* Password Requirements */}
                            <div className="grid gap-2">
                              <motion.div 
                                animate={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: -10 }}
                                className={`flex items-center gap-2 text-sm ${
                                  validations.length 
                                    ? darkMode ? 'text-green-400' : 'text-green-600'
                                    : darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                  validations.length
                                    ? darkMode ? 'bg-green-500/20' : 'bg-green-100'
                                    : darkMode ? 'bg-gray-800' : 'bg-gray-100'
                                }`}>
                                  {validations.length ? '✓' : '·'}
                                </div>
                                <span>At least 8 characters</span>
                              </motion.div>
                              
                              <motion.div 
                                animate={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: -10 }}
                                transition={{ delay: 0.1 }}
                                className={`flex items-center gap-2 text-sm ${
                                  validations.uppercase
                                    ? darkMode ? 'text-green-400' : 'text-green-600'
                                    : darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                  validations.uppercase
                                    ? darkMode ? 'bg-green-500/20' : 'bg-green-100'
                                    : darkMode ? 'bg-gray-800' : 'bg-gray-100'
                                }`}>
                                  {validations.uppercase ? '✓' : '·'}
                                </div>
                                <span>One uppercase letter</span>
                              </motion.div>
                              
                              <motion.div 
                                animate={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: -10 }}
                                transition={{ delay: 0.2 }}
                                className={`flex items-center gap-2 text-sm ${
                                  validations.lowercase
                                    ? darkMode ? 'text-green-400' : 'text-green-600'
                                    : darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                  validations.lowercase
                                    ? darkMode ? 'bg-green-500/20' : 'bg-green-100'
                                    : darkMode ? 'bg-gray-800' : 'bg-gray-100'
                                }`}>
                                  {validations.lowercase ? '✓' : '·'}
                                </div>
                                <span>One lowercase letter</span>
                              </motion.div>
                              
                              <motion.div 
                                animate={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: -10 }}
                                transition={{ delay: 0.3 }}
                                className={`flex items-center gap-2 text-sm ${
                                  validations.number
                                    ? darkMode ? 'text-green-400' : 'text-green-600'
                                    : darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                  validations.number
                                    ? darkMode ? 'bg-green-500/20' : 'bg-green-100'
                                    : darkMode ? 'bg-gray-800' : 'bg-gray-100'
                                }`}>
                                  {validations.number ? '✓' : '·'}
                                </div>
                                <span>One number</span>
                              </motion.div>
                              
                              <motion.div 
                                animate={{ opacity: 1, y: 0 }}
                                initial={{ opacity: 0, y: -10 }}
                                transition={{ delay: 0.4 }}
                                className={`flex items-center gap-2 text-sm ${
                                  validations.special
                                    ? darkMode ? 'text-green-400' : 'text-green-600'
                                    : darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                  validations.special
                                    ? darkMode ? 'bg-green-500/20' : 'bg-green-100'
                                    : darkMode ? 'bg-gray-800' : 'bg-gray-100'
                                }`}>
                                  {validations.special ? '✓' : '·'}
                                </div>
                                <span>One special character</span>
                              </motion.div>
                            </div>
                          </div>
                        )}
                      </div>

                      {formData.newPassword && (
                        <div>
                          <label className={`block mb-2 ${darkMode ? 'text-blue-200' : 'text-gray-700'}`} htmlFor="confirmPassword">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? "text" : "password"}
                              id="confirmPassword"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                                darkMode 
                                  ? 'bg-gray-800/50 border-gray-700 text-blue-100 focus:ring-blue-500' 
                                  : 'bg-gray-50 border-gray-300 text-gray-800 focus:ring-green-500'
                              } ${
                                formData.confirmPassword && !passwordMatch 
                                  ? 'border-red-500 focus:ring-red-500' 
                                  : formData.confirmPassword && passwordMatch
                                    ? 'border-green-500 focus:ring-green-500'
                                    : ''
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition ${
                                darkMode 
                                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                          {formData.confirmPassword && !passwordMatch && (
                            <p className={`text-xs mt-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                              Passwords don't match
                            </p>
                          )}
                          {formData.confirmPassword && passwordMatch && (
                            <p className={`text-xs mt-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                              Passwords match
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-4">
                        <motion.button
                          type="button"
                          onClick={() => setEditMode(false)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                            darkMode 
                              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-gray-200' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          disabled={loading}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          id="saveButton"
                          type="submit"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg ${
                            loading 
                              ? darkMode 
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-gray-400 text-white'
                              : darkMode 
                                ? passwordMatch && (!formData.newPassword || passwordStrength >= 3)
                                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-green-500/20'
                                  : 'bg-gradient-to-r from-blue-700 to-blue-600 text-blue-100 hover:shadow-blue-500/20'
                                : passwordMatch && (!formData.newPassword || passwordStrength >= 3)
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-green-500/30'
                                  : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-blue-500/30'
                          } disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden`}
                          disabled={loading || (formData.newPassword && (!passwordMatch || passwordStrength < 3))}
                        >
                          {loading ? (
                            <>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                className={`absolute inset-0 ${darkMode ? 'bg-blue-500/20' : 'bg-white/20'}`}
                                transition={{ duration: 1, repeat: Infinity }}
                              />
                              <span className="z-10 flex items-center gap-2">
                                <FaSave className="text-sm animate-pulse" /> Saving...
                              </span>
                            </>
                          ) : (
                            <span className="z-10 flex items-center gap-2">
                              <FaSave className="text-sm" /> Save Changes
                            </span>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-gray-500'}`}>Name</h3>
                          <p className={`mt-1 ${darkMode ? 'text-blue-100' : 'text-gray-900'}`}>{user.name}</p>
                        </div>
                        <div>
                          <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-gray-500'}`}>Email</h3>
                          <p className={`mt-1 ${darkMode ? 'text-blue-100' : 'text-gray-900'}`}>{user.email}</p>
                        </div>
                        <div>
                          <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-gray-500'}`}>Role</h3>
                          <p className={`mt-1 capitalize ${darkMode ? 'text-blue-100' : 'text-gray-900'}`}>{user.role}</p>
                        </div>
                        <div>
                          <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-gray-500'}`}>Status</h3>
                          <p className={`mt-1 font-bold ${darkMode ? 'text-blue-300' : 'text-green-700'}`}>Active</p>
                        </div>
            {userCreatedAt && (
                          <div>
                            <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-gray-500'}`}>Created</h3>
              <p className={`mt-1 ${darkMode ? 'text-blue-100' : 'text-gray-900'}`}>{new Date(userCreatedAt).toLocaleDateString()}</p>
                          </div>
                        )}
            {userUpdatedAt && (
                          <div>
                            <h3 className={`text-sm font-medium ${darkMode ? 'text-blue-200' : 'text-gray-500'}`}>Last Updated</h3>
              <p className={`mt-1 ${darkMode ? 'text-blue-100' : 'text-gray-900'}`}>{new Date(userUpdatedAt).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 pt-6">
                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            onClick={() => {
                                handleLogout();
                              
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
                              darkMode 
                                ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-blue-100 hover:shadow-blue-500/20' 
                                : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-blue-500/30'
                            }`}
                          >
                            <FaSignOutAlt className="text-sm" /> Logout
                          </motion.button>
                          <motion.button
                            onClick={() => setEditMode(true)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
                              darkMode 
                                ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-purple-100 hover:shadow-purple-500/20' 
                                : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-purple-500/30'
                            }`}
                          >
                            <FaUser className="text-sm" /> Edit Profile
                          </motion.button>
                        </div>
                        <motion.button 
                          onClick={() => setShowDeleteModal(true)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                            darkMode 
                              ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30 border border-red-600/30' 
                              : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                          }`}
                        >
                          <FaTrash className="text-sm" /> Delete Account
                        </motion.button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* Custom Delete Account Modal */}
          <AnimatePresence>
            {showDeleteModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
              >
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                
                <motion.div 
                  id="deleteModal"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className={`w-full sm:w-[28rem] overflow-hidden relative rounded-t-2xl sm:rounded-2xl shadow-2xl ${
                    darkMode 
                      ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100' 
                      : 'bg-white text-gray-800'
                  }`}
                >
                  {/* Header */}
                  <div className={`px-6 py-4 border-b ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <motion.h3 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-xl font-bold flex items-center gap-2"
                      >
                        <span className={`p-2 rounded-full ${
                          darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                        }`}>
                          <FaTrash />
                        </span>
                        Delete Account
                      </motion.h3>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowDeleteModal(false)}
                        className={`p-2 rounded-full transition-colors ${
                          darkMode 
                            ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <FaTimes />
                      </motion.button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className={`p-4 rounded-lg border ${
                        darkMode 
                          ? 'bg-red-500/10 border-red-500/20 text-red-300' 
                          : 'bg-red-50 border-red-100 text-red-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1 mt-1 rounded-full ${
                          darkMode ? 'bg-red-500/20' : 'bg-red-100'
                        }`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">Warning: This action cannot be undone</h4>
                          <p className="text-sm opacity-90">
                            All your data, including your profile, orders, and preferences will be permanently deleted.
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border ${
                          darkMode 
                            ? 'bg-red-500/10 border-red-500/20 text-red-300' 
                            : 'bg-red-50 border-red-100 text-red-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FaTimes className="flex-shrink-0" />
                          <p className="text-sm font-medium">{error}</p>
                        </div>
                      </motion.div>
                    )}

                    <div className="space-y-4">
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <label className={`block text-sm font-medium mb-1.5 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Confirm your email address
                        </label>
                        <input
                          type="email"
                          value={deleteEmail}
                          onChange={(e) => setDeleteEmail(e.target.value)}
                          placeholder={user.email}
                          className={`w-full p-3 border rounded-lg transition-all duration-200 ${
                            darkMode 
                              ? 'bg-gray-800/50 border-gray-700 text-gray-100 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                              : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                          }`}
                        />
                      </motion.div>

                      {deleteEmail === user.email && (
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <label className={`block text-sm font-medium mb-1.5 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Enter your password
                          </label>
                          <input
                            id="deletePassword"
                            type="password"
                            placeholder="Enter your password"
                            className={`w-full p-3 border rounded-lg transition-all duration-200 ${
                              darkMode 
                                ? 'bg-gray-800/50 border-gray-700 text-gray-100 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                                : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                            }`}
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className={`px-6 py-4 border-t ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-end gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDeleteModal(false)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          darkMode 
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-gray-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDelete}
                        disabled={deleteEmail !== user.email || loading}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                          deleteEmail === user.email
                            ? loading
                              ? darkMode 
                                ? 'bg-red-500/50 text-red-200 cursor-not-allowed'
                                : 'bg-red-400 text-white cursor-not-allowed'
                              : darkMode
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            : darkMode
                              ? 'bg-red-500/30 text-red-300 cursor-not-allowed'
                              : 'bg-red-300 text-white cursor-not-allowed'
                        }`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <FaTrash className="text-sm" />
                            Delete Account
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}