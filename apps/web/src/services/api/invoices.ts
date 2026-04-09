import { apiFetch, API_BASE_URL } from './base';

export interface InvoiceDetail {
  id: number;
  description: string;
  amount: string;
  invoice_id: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceStatusHistory {
  id: number;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  timestamp: string;
  actor_id: string | null;
  invoice_id: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  room_code: string;
  tenant_name: string;
  details: InvoiceDetail[];
  histories: InvoiceStatusHistory[];
  total_amount: string;
  status: 'UNPAID' | 'PENDING_CONFIRMATION' | 'PAID' | 'VOIDED';
  created_at: string;
  updated_at: string;
}

export async function getInvoices(): Promise<Invoice[]> {
  const res = await apiFetch(`${API_BASE_URL}/invoices`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch invoices');
  return res.json();
}

export async function getInvoice(id: number): Promise<Invoice> {
  const res = await apiFetch(`${API_BASE_URL}/invoices/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch invoice');
  return res.json();
}

export async function createInvoice(
  payload: Partial<Invoice>,
): Promise<Invoice> {
  const res = await apiFetch(`${API_BASE_URL}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create invoice');
  return res.json();
}

export async function calculateInvoice(
  roomId: string,
  periodMonth: string,
): Promise<{
  room_code: string;
  tenant_name: string;
  details: { description: string; amount: string }[];
  total_amount: string;
}> {
  const res = await apiFetch(`${API_BASE_URL}/invoices/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId, period_month: periodMonth }),
  });
  if (!res.ok) throw new Error('Failed to calculate invoice');
  return res.json();
}

export async function voidInvoice(
  id: number,
  reason: string,
): Promise<Invoice> {
  const res = await apiFetch(`${API_BASE_URL}/invoices/${id}/void`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Failed to void invoice');
  return res.json();
}

export async function payInvoice(id: number): Promise<Invoice> {
  const res = await apiFetch(`${API_BASE_URL}/invoices/${id}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to pay invoice');
  return res.json();
}
