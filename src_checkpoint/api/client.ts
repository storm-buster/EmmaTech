import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// For Netlify, API functions are available at /.netlify/functions
// In development with netlify dev, they're at the same origin
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface RetryableAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens or custom headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling with retry logic
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config;

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as { message?: string };

      // Retry logic for 5xx errors (once)
      if (status >= 500 && config && !(config as RetryableAxiosRequestConfig)._retry) {
        (config as RetryableAxiosRequestConfig)._retry = true;
        console.log('Retrying request after server error...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return apiClient(config);
      }

      switch (status) {
        case 400:
          console.error('Bad Request:', data.message);
          break;
        case 409:
          console.error('Conflict:', data.message);
          break;
        case 429:
          console.error('Rate Limit Exceeded:', data.message);
          break;
        case 500:
        case 502:
        case 503:
          console.error('Server Error:', data.message);
          break;
        default:
          console.error('API Error:', data.message);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error: No response from server');
    } else {
      // Error in request setup
      console.error('Request Error:', error.message);
    }

    return Promise.reject(error);
  }
);
