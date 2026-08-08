import axios from 'axios';
import { getAccessToken } from '@/lib/auth';
import {
  refreshAdminTokens,
  forceLogout,
} from '@/lib/token-refresh';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const tokens = await refreshAdminTokens();
      if (tokens) {
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(originalRequest);
      }
      forceLogout();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
