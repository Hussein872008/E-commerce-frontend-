import axios from 'axios';

// Base URL from Vite env (set VITE_API_BASE_URL in .env)
const baseURL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL,
  withCredentials: true
});

// Helper to set auth header for convenience
export function setAuthToken(token) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
}

export default api;
