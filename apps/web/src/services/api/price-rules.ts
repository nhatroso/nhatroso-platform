import {
  PriceRule,
  CreatePriceRuleInput,
  UpdatePriceRuleInput,
} from '@nhatroso/shared';
import { apiFetch, API_BASE_URL } from './base';

export const priceRulesApi = {
  listByService: async (serviceId: string): Promise<PriceRule[]> => {
    const res = await apiFetch(
      `${API_BASE_URL}/price-rules/service/${serviceId}`,
    );
    if (!res.ok) throw new Error('Failed to fetch service price rules');
    return res.json();
  },

  create: async (data: CreatePriceRuleInput): Promise<PriceRule> => {
    const res = await apiFetch(`${API_BASE_URL}/price-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.code || 'Failed to create price rule');
    }
    return res.json();
  },

  update: async (
    id: string,
    data: UpdatePriceRuleInput,
  ): Promise<PriceRule> => {
    const res = await apiFetch(`${API_BASE_URL}/price-rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.code || 'Failed to update price rule');
    }
    return res.json();
  },

  remove: async (id: string): Promise<void> => {
    const res = await apiFetch(`${API_BASE_URL}/price-rules/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.code || 'Failed to remove price rule');
    }
  },
};
