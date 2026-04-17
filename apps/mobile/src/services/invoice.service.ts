import { apiClient } from './api';
import { InvoiceResponse } from '@nhatroso/shared';

export const invoiceService = {
  getMyInvoices: async (): Promise<InvoiceResponse[]> => {
    const response = await apiClient.get<InvoiceResponse[]>('/v1/invoices');
    return response.data;
  },

  getInvoiceDetail: async (id: number): Promise<InvoiceResponse> => {
    const response = await apiClient.get<InvoiceResponse>(`/v1/invoices/${id}`);
    return response.data;
  },

  payInvoice: async (id: number): Promise<InvoiceResponse> => {
    const response = await apiClient.post<InvoiceResponse>(
      `/v1/invoices/${id}/pay`,
    );
    return response.data;
  },

  createPayment: async (
    invoice_id: number,
    amount: number,
  ): Promise<{
    transaction_id: string;
    token: string;
    payment_url: string;
  }> => {
    const response = await apiClient.post<{
      transaction_id: string;
      token: string;
      payment_url: string;
    }>('/v1/payments', { invoice_id, amount });
    return response.data;
  },
};
