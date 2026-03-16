export interface Contract {
  id: string; // uuid
  room_id: string; // uuid
  room_code: string; // room code
  start_date: string; // date YYYY-MM-DD
  end_date: string | null; // date YYYY-MM-DD
  payment_cycle: string; // "MONTHLY"
  deposit_amount: number;
  monthly_rent: number;
  status: string; // "ACTIVE" | "ENDED"
  tenant_name: string;
  owner_name: string;
  building_name: string;
  floor_name?: string;
  created_at: string;
  updated_at: string;
  landlord_name: string;
  landlord_id_card: string;
  landlord_id_date: string;
  landlord_address: string;
  landlord_phone: string;
  tenant_id_card: string;
  tenant_id_date: string;
  tenant_address: string;
  tenant_phone: string;
}

export interface ContractTenant {
  contract_id: string; // uuid
  tenant_id: string; // uuid
}

export interface TenantLookupResult {
  found: boolean;
  user?: {
    id: string;
    name: string;
    phone: string;
  };
  has_active_contract: boolean;
}
