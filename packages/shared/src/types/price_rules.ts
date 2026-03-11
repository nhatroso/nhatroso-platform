export interface PriceRule {
  id: string;
  room_id: string;
  service_id: string;
  unit_price: string;
  effective_start: string;
  effective_end: string | null;
  created_at: string;
  updated_at: string;
}
