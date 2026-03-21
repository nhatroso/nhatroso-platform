export interface PriceRule {
  id: string;
  owner_id: string;
  service_id: string;
  unit_price: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePriceRuleInput {
  service_id: string;
  unit_price: number;
  name?: string;
}

export interface UpdatePriceRuleInput {
  unit_price?: number;
  name?: string;
}
