import api, { setAuthToken } from '../utils/api';
import store from './store';
import { refreshToken, logout } from './authSlice';

export default function setupAxiosInterceptors() {
  const token = localStorage.getItem('token');
  if (token) setAuthToken(token);
  let isRefreshing = false;
  let refreshPromise = null;
  const failedQueue = [];

  const processQueue = (error, token = null) => {
    while (failedQueue.length) {
      const { resolve, reject } = failedQueue.shift();
      if (error) reject(error);
      else resolve(token);
    }
  };

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = store.dispatch(refreshToken()).unwrap()
            .then((newToken) => {
              if (newToken) setAuthToken(newToken);
              processQueue(null, newToken);
              return newToken;
            })
            .catch((err) => {
              processQueue(err, null);
              store.dispatch(logout());
              throw err;
            })
            .finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
        }

        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: async (token) => {
              try {
                if (token) {
                  originalRequest.headers['Authorization'] = `Bearer ${token}`;
                }
                const resp = await api(originalRequest);
                resolve(resp);
              } catch (reqErr) {
                reject(reqErr);
              }
            },
            reject: (err) => reject(err)
          });
        });
      }

      return Promise.reject(error);
    }
  );
}
