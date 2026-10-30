import axios from 'axios';

// Normalize baseURL so it always targets the /api prefix
let rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
rawBaseUrl = rawBaseUrl.replace(/\/+$/, '');
const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('researchlens_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle responses and session expiration
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('researchlens_token');
        localStorage.removeItem('researchlens_user');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

