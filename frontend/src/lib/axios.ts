import axios from 'axios';

// Client for calling Next.js internal API routes (browser -> Next API)
const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
  // Cookies for same-origin API (session + role cookies)
  withCredentials: true,
});

// Request interceptor (add auth token if available)
axiosInstance.interceptors.request.use(
  (config) => {
    // Session cookies are automatically sent with withCredentials: true
    // No need to manually add Authorization header (OpenMRS uses session cookies)
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (handle errors globally)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
