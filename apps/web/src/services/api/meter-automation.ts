import { apiFetch } from './base';

export interface MeterRequestConfig {
  id: string;
  landlord_id: string;
  day_of_month: number;
  grace_days: number;
  auto_generate: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConfigParams {
  day_of_month: number;
  grace_days: number;
  auto_generate: boolean;
}

export interface MeterRequest {
  id: string;
  room_id: string;
  room_code: string;
  period_month: string;
  due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GenerateManualParams {
  building_id: string;
  period_month: string;
  due_date: string;
}

export const meterAutomationService = {
  getMeterConfig: async (): Promise<MeterRequestConfig | null> => {
    const res = await apiFetch(`/landlord/meter-request-configs`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      if (res.status === 404 || res.status === 204) return null;
      throw new Error('Failed to fetch meter configuration');
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
  },

  updateMeterConfig: async (
    data: ConfigParams,
  ): Promise<MeterRequestConfig> => {
    const res = await apiFetch(`/landlord/meter-request-configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Failed to update meter configuration');
    }

    return res.json();
  },

  getMeterRequests: async (periodMonth?: string): Promise<MeterRequest[]> => {
    let url = `/landlord/meter-requests`;
    if (periodMonth) {
      url += `?period_month=${encodeURIComponent(periodMonth)}`;
    }

    const res = await apiFetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch meter requests');
    }

    return res.json();
  },

  generateManualRequests: async (
    data: GenerateManualParams,
  ): Promise<{ generated_count: number }> => {
    const res = await apiFetch(`/landlord/meter-requests/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Failed to generate manual meter requests');
    }

    return res.json();
  },
};
