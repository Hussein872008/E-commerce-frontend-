import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || (allowedRoles.length > 0 && !allowedRoles.includes(role))) {
    return null;
  }

  return children;
};

export default ProtectedRoute;