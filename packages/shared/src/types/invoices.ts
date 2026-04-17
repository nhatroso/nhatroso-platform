export interface InvoiceDetail {
  id: number;
  invoice_id: number;
  description: string;
  amount: string;
}

export interface InvoiceHistory {
  id: number;
  invoice_id: number;
  from_status: string | null;
  to_status: string | null;
  reason: string | null;
  timestamp: string | null;
  actor_id: string | null;
}

export interface InvoiceModel {
  id: number;
  room_code: string | null;
  tenant_name: string | null;
  total_amount: string | null;
  status: string | null;
  room_id: string | null;
  landlord_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceResponse extends InvoiceModel {
  details: InvoiceDetail[];
  histories: InvoiceHistory[];
}
