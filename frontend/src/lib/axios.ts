import axios from 'axios';
import type { ApiResult } from '@/types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function for API calls
export async function apiCall<T>(
  promise: Promise<{ data: ApiResult<T> }>
): Promise<T> {
  const response = await promise;
  if (response.data.error) {
    throw new Error(response.data.error.message);
  }
  return response.data.data;
}

export default api;
