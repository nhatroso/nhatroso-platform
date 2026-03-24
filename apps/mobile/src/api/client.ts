import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';

// Base URL for the Rust backend
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper for adding auth token if needed
apiClient.interceptors.request.use(async (config) => {
  // In a real app, get token from secure storage
  // const token = await SecureStore.getItemAsync('userToken');
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});
