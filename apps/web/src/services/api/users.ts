import { apiFetch, API_BASE_URL } from './base';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  id_card?: string;
  id_card_date?: string;
  address?: string;
}

export interface UserLookupResult {
  id: string;
  name: string;
  phone: string;
  id_card?: string;
  id_card_date?: string;
  address?: string;
}

export interface LookupUserResponse {
  exists: boolean;
  user: UserLookupResult | null;
  has_active_contract: boolean;
}

export const usersService = {
  lookupByPhone: async (phone: string): Promise<LookupUserResponse> => {
    const res = await apiFetch(
      `${API_BASE_URL}/users/lookup?phone=${encodeURIComponent(phone)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    );

    // We expect the server to return { exists, user, has_active_contract }
    if (!res.ok) {
      console.warn('Failed to lookup user by phone');
      return { exists: false, user: null, has_active_contract: false };
    }

    return res.json();
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    const res = await apiFetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch current user profile');
    }

    const data = await res.json();
    return data.user;
  },
};
