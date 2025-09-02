


import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Unauthorized() {
  const navigate = useNavigate();
  const darkMode = useSelector(state => state.theme.darkMode);

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-900 to-blue-900' : 'bg-gray-100'}`}>
      <div className={`p-8 rounded-lg shadow-md text-center max-w-md w-full transition-colors duration-500 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}>
        <div className="text-6xl mb-4">🔒</div>
        <h1 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
          Unauthorized Access
        </h1>
        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          You don't have permission to access this resource.
          Please contact the administrator if you believe this is a mistake.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className={`w-full py-2 px-4 rounded-md transition-colors duration-300 ${darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className={`w-full py-2 px-4 rounded-md transition-colors duration-300 ${darkMode ? 'bg-blue-700 text-blue-100 hover:bg-blue-800' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            Go to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}