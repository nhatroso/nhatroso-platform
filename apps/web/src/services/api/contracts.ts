import { CreateContractParams, ContractResponse } from '@nhatroso/shared';
import { apiFetch } from './base';

export const contractsService = {
  create: async (data: CreateContractParams): Promise<ContractResponse> => {
    const res = await apiFetch(`/contracts`, {
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
    const res = await apiFetch(`/contracts/${id}`, {
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
    const res = await apiFetch(`/contracts`, {
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
