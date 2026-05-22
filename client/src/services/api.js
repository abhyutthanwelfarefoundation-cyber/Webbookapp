import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || '';

    // NEVER redirect or toast on login route errors
    // Let the login page handle its own errors
    if (url.includes('/auth/login')) {
      return Promise.reject(err);
    }

    // Only redirect to login if token expired on OTHER routes
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    return Promise.reject(err);
  }
);

export default api;