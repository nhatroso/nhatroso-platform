import {
  Service,
  CreateServiceParams,
  UpdateServiceParams,
} from '@nhatroso/shared';
import { apiFetch } from './base';

export const servicesApi = {
  list: async (): Promise<Service[]> => {
    const res = await apiFetch(`/services`);
    if (!res.ok) throw new Error('Failed to fetch services');
    const json = await res.json();
    return Array.isArray(json) ? json : json.data || [];
  },

  create: async (data: CreateServiceParams): Promise<Service> => {
    const res = await apiFetch(`/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create service');
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  },

  update: async (id: string, data: UpdateServiceParams): Promise<Service> => {
    const res = await apiFetch(`/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update service');
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  },

  archive: async (id: string): Promise<Service> => {
    const res = await apiFetch(`/services/${id}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to archive service');
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  },
};
