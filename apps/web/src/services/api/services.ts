import {
  Service,
  CreateServiceParams,
  UpdateServiceParams,
} from '@nhatroso/shared';
import { apiFetch, API_BASE_URL } from './base';

export const servicesApi = {
  list: async (): Promise<Service[]> => {
    const res = await apiFetch(`${API_BASE_URL}/services`);
    if (!res.ok) throw new Error('Failed to fetch services');
    const json = await res.json();
    return json.data || [];
  },

  create: async (data: CreateServiceParams): Promise<Service> => {
    const res = await apiFetch(`${API_BASE_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create service');
    const json = await res.json();
    return json.data;
  },

  update: async (id: string, data: UpdateServiceParams): Promise<Service> => {
    const res = await apiFetch(`${API_BASE_URL}/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update service');
    const json = await res.json();
    return json.data;
  },

  archive: async (id: string): Promise<Service> => {
    const res = await apiFetch(`${API_BASE_URL}/services/${id}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to archive service');
    const json = await res.json();
    return json.data;
  },
};
