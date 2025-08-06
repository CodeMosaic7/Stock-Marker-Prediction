import axios from 'axios';

// Create axios configuration
const apiClient = axios.create({
  // baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  baseURL:'http://localhost:8000/api',
  timeout: 30000, //timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 403:
          console.error('Access forbidden:', data?.detail || 'Forbidden');
          break;
          
        case 404:
          console.error('Resource not found:', data?.detail || 'Not found');
          break;
          
        case 429:
          console.error('Rate limit exceeded:', data?.detail || 'Too many requests');
          break;
          
        case 500:
          console.error('Server error:', data?.detail || 'Internal server error');
          break;
          
        default:
          console.error('API Error:', data?.detail || error.message);
      }
      
      // Return structured error
      return Promise.reject({
        status,
        message: data?.detail || data?.error || error.message,
        timestamp: data?.timestamp,
        originalError: error,
      });
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
      return Promise.reject({
        status: 0,
        message: 'Network error - please check your connection',
        originalError: error,
      });
    } else {
      // Other error
      console.error('Request setup error:', error.message);
      return Promise.reject({
        status: -1,
        message: error.message,
        originalError: error,
      });
    }
  }
);

export default apiClient;