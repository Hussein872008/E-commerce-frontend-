import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/';

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT_MS || '20000', 10)
});

export function setAuthToken(token) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
}

export default api;
