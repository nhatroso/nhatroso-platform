import { apiClient } from './client';
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
};
