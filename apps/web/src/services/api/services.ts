import {
  Service,
  CreateServiceParams,
  UpdateServiceParams,
} from '@nhatroso/shared';

const API_BASE_URL = '/api/proxy';

async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const localeMatch = pathname.match(/^\/(vi|en)/);
      const locale = localeMatch ? localeMatch[1] : '';
      window.location.href = locale ? `/${locale}/login` : '/login';
    }
  }

  return res;
}

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
