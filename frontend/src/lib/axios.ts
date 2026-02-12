import axios from 'axios';
import type { ApiResult } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
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
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    // Use API error message when present (e.g. email send failure)
    const apiMessage = error.response?.data?.error?.message;
    if (apiMessage && typeof apiMessage === 'string') {
      return Promise.reject(new Error(apiMessage));
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
