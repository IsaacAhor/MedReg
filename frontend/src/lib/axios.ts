import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_OPENMRS_API_URL || 'http://localhost:8080/openmrs/ws/rest/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests (session management)
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
