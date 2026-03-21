export interface RoomService {
  id: string;
  room_id: string;
  service_id: string;
  price_rule_id: string | null;
  is_active: boolean;
  service_name: string;
  unit: string;
  unit_price: string | null;
  rule_name?: string | null;
}

export interface AssignServiceInput {
  service_id: string;
  price_rule_id?: string | null;
}

export interface UpdateAssignedServiceInput {
  price_rule_id?: string | null;
  is_active?: boolean;
}
