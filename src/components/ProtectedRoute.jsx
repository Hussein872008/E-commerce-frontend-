import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Unauthorized from '../pages/Unauthorized';
import { Link } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, role } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && role && typeof role !== 'undefined' && role !== '') {
      if (!isAuthenticated) {
        toast.error('Please login to access this page');
        navigate('/login', { state: { from: location.pathname } });
      } else if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        toast.error('You are not authorized to access this page');
        navigate('/unauthorized', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, role, allowedRoles, navigate, location]);




  const darkMode = useSelector(state => state.theme.darkMode);
  if (isLoading) {
    return (
      <div className={`flex justify-center items-center h-screen transition-colors duration-500 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-blue-300' : 'border-blue-500'}`}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-900 to-blue-900' : 'bg-gray-100'}`}>
        <div className={`p-8 rounded-lg shadow-md text-center max-w-md w-full transition-colors duration-500 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}>
          <div className="text-6xl mb-4">🔑</div>
          <h1 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Login Required</h1>
          <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>You must be logged in to access this page.</p>
          <Link to="/login" className={`w-full py-2 px-4 rounded-md block transition-colors duration-300 ${darkMode ? 'bg-blue-700 text-blue-100 hover:bg-blue-800' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>Go to Login</Link>
        </div>
      </div>
    );
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Unauthorized />;
  }

  return children;
};

export default ProtectedRoute;