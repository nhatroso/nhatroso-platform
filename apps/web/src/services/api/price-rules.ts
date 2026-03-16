import {
  PriceRule,
  CreatePriceRuleParams,
  UpdatePriceRuleParams,
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

export const priceRulesApi = {
  listByRoom: async (roomId: string): Promise<PriceRule[]> => {
    const res = await apiFetch(`${API_BASE_URL}/rooms/${roomId}/price_rules`);
    if (!res.ok) throw new Error('Failed to fetch price rules');
    const json = await res.json();
    return json.data || [];
  },

  create: async (
    roomId: string,
    data: CreatePriceRuleParams,
  ): Promise<PriceRule> => {
    const res = await apiFetch(`${API_BASE_URL}/rooms/${roomId}/price_rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create price rule');
    const json = await res.json();
    return json.data;
  },

  update: async (
    id: string,
    data: UpdatePriceRuleParams,
  ): Promise<PriceRule> => {
    const res = await apiFetch(`${API_BASE_URL}/price_rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update price rule');
    const json = await res.json();
    return json.data;
  },

  remove: async (id: string): Promise<void> => {
    const res = await apiFetch(`${API_BASE_URL}/price_rules/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove price rule');
  },
};
