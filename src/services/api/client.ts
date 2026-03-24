import axios from 'axios';
import { useAuthStore } from '@/app/store/authStore';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 (expired/invalid token)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { isAuthenticated, logout } = useAuthStore.getState();
      // Only auto-logout if we thought we were authenticated
      if (isAuthenticated) {
        logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data } = await promise;
  if (!data.success || data.data === null) {
    throw new Error(data.error || 'Request failed');
  }
  return data.data;
}

export default client;
