import api, { setAuthToken } from '../utils/api';
import store from './store';
import { refreshToken, logout } from './authSlice';

export default function setupAxiosInterceptors() {
  const token = localStorage.getItem('token');
  if (token) setAuthToken(token);
  api.interceptors.request.use((config) => {
    try {
      const stateToken = store.getState && store.getState().auth && store.getState().auth.token;
      if (stateToken && (!config.headers || !config.headers.Authorization)) {
        if (!config.headers) config.headers = {};
        config.headers.Authorization = `Bearer ${stateToken}`;
      }
    } catch (e) {
    }
    return config;
  }, (err) => Promise.reject(err));
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
      if (!error || !error.response) {
        return Promise.reject(error);
      }
      const originalRequest = error.config;
      if (!originalRequest) return Promise.reject(error);
      const authPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh-token', '/api/auth/forgot-password', '/api/auth/reset-password'];
      try {
        let requestPath = '';
        try {
          if (originalRequest && originalRequest.url) {
            if (originalRequest.baseURL) {
              requestPath = new URL(originalRequest.url, originalRequest.baseURL).pathname;
            } else {
              requestPath = originalRequest.url;
            }
          }
        } catch (e) {
          requestPath = originalRequest && originalRequest.url ? originalRequest.url : '';
        }

        if (authPaths.some(p => requestPath.includes(p))) {
          return Promise.reject(error);
        }
      } catch (e) {
      }
 const status = error.response?.status;
      if ((status === 401 || status === 403) && !(originalRequest._retryCount >= 1)) {
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = store.dispatch(refreshToken()).unwrap()
            .then((res) => {
              const newToken = res && (typeof res === 'string' ? res : (res.token || res.accessToken || null));
              if (newToken) setAuthToken(newToken);
              processQueue(null, newToken);
              return newToken;
            })
            .catch((err) => {
              processQueue(err, null);
              try { store.dispatch(logout()); } catch (e) {}
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
                const headers = Object.assign({}, originalRequest.headers || {});
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const retryReq = Object.assign({}, originalRequest, { headers });
                retryReq._retry = true;
                const resp = await api.request(retryReq);
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
