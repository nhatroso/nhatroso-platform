import { apiFetch } from './base';

export interface AutoInvoiceConfig {
  id: string;
  landlord_id: string;
  day_of_month: number;
  grace_days: number;
  auto_generate: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateAutoInvoiceConfigParams {
  day_of_month: number;
  grace_days: number;
  auto_generate: boolean;
}

export const autoInvoiceService = {
  getAutoInvoiceConfig: async (): Promise<AutoInvoiceConfig | null> => {
    const response = await apiFetch('/landlord/auto-invoice-configs');
    if (!response.ok) return null;

    const text = await response.text();
    if (!text) return null;

    return JSON.parse(text);
  },

  updateAutoInvoiceConfig: async (
    params: UpdateAutoInvoiceConfigParams,
  ): Promise<AutoInvoiceConfig> => {
    const response = await apiFetch('/landlord/auto-invoice-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to update auto invoice config');
    return response.json();
  },
};
