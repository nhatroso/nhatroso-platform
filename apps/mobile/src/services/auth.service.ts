import { apiClient } from './api';
import { LoginInput, AuthResponse } from '@nhatroso/shared';

export const authService = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      phone: data.phone,
      password: data.password,
    });
    return response.data;
  },

  // Placeholder for future auth methods
  logout: async () => {
    // Optional: notify backend of logout
  },
};
