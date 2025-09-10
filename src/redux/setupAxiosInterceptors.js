import api, { setAuthToken } from '../utils/api';
import store from './store';
import { refreshToken, logout } from './authSlice';

export default function setupAxiosInterceptors() {
  const token = localStorage.getItem('token');
  if (token) setAuthToken(token);

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newToken = await store.dispatch(refreshToken()).unwrap();
          setAuthToken(newToken);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          store.dispatch(logout());
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );
}
