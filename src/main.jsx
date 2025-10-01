import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import store from './redux/store';
import './index.css' 
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useSelector, useDispatch } from 'react-redux';
import { setAuthToken } from './utils/api';
import setupAxiosInterceptors from './redux/setupAxiosInterceptors';
import { verifyToken } from './redux/authSlice';
import { initializeNotifications } from './redux/notificationSlice';



function Root() {
  const dispatch = useDispatch();
  const darkMode = useSelector(state => state.theme.darkMode);
  const auth = useSelector(state => state.auth);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(verifyToken());
    }
  }, [dispatch]);

  React.useEffect(() => {
    if (auth?.isAuthenticated && auth.user?._id) {
      const cleanup = dispatch(initializeNotifications(auth.user._id));
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, [auth?.isAuthenticated, auth?.user?._id, dispatch]);
  return (
    <BrowserRouter>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? "dark" : "light"}
      />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
  {(() => {
    try {
      setAuthToken(localStorage.getItem('token'));
      setupAxiosInterceptors();
    } catch (e) {
    }
    return null;
  })()}
  <Root />
    </Provider>
  </React.StrictMode>
);

