export interface Room {
  id: string; // uuid
  building_id: string; // uuid
  block_id: string; // uuid
  floor_id: string | null; // uuid
  room_code: string;
  code: string;
  building_name?: string;
  room_address?: string;
  floor_name?: string;
  status: string; // e.g. "VACANT", "OCCUPIED", "ARCHIVED", etc.
  created_at: string;
  updated_at: string;
}
