import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { CONFIG } from '../config';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Base URL for the Rust backend
const BASE_URL = CONFIG.API_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper for adding auth token if needed
apiClient.interceptors.request.use(async (config) => {
  try {
    let authData: string | null = null;
    if (Platform.OS === 'web') {
      authData = localStorage.getItem('auth_data');
    } else {
      authData = await SecureStore.getItemAsync('auth_data');
    }

    if (authData) {
      const { token } = JSON.parse(authData);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
    console.error('Failed to add auth header', e);
  }
  return config;
});

let logoutHandler: (() => void) | null = null;

export const setLogoutHandler = (handler: () => void | Promise<void>) => {
  logoutHandler = handler;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (logoutHandler) {
        logoutHandler();
      }
    }
    return Promise.reject(error);
  },
);
