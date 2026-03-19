export interface PriceRule {
  id: string;
  owner_id: string;
  room_id: string | null;
  building_id: string | null;
  service_id: string;
  unit_price: string;
  effective_start: string;
  effective_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePriceRuleInput {
  room_id?: string | null;
  building_id?: string | null;
  service_id: string;
  unit_price: number;
  effective_start: string;
}

export interface UpdatePriceRuleInput {
  unit_price?: number;
  effective_start?: string;
}
