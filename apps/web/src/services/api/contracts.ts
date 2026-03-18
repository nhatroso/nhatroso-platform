import { CreateContractParams, ContractResponse } from '@nhatroso/shared';
import { apiFetch, API_BASE_URL } from './base';

export const contractsService = {
  create: async (data: CreateContractParams): Promise<ContractResponse> => {
    const res = await apiFetch(`${API_BASE_URL}/contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new Error(errBody?.error?.code || 'Failed to create contract');
    }
    return res.json();
  },

  getById: async (id: string): Promise<ContractResponse> => {
    const res = await apiFetch(`${API_BASE_URL}/contracts/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      console.error('getById error:', errBody);
      throw new Error(errBody?.error?.code || 'Failed to fetch contract');
    }
    return res.json();
  },

  list: async (): Promise<ContractResponse[]> => {
    const res = await apiFetch(`${API_BASE_URL}/contracts`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      console.error('list error:', res.status, errBody);
      throw new Error(errBody?.error?.code || 'Failed to list contracts');
    }
    return res.json();
  },
};
