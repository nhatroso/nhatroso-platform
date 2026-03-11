export interface Floor {
  id: string; // uuid
  building_id: string; // uuid
  block_id: string; // uuid
  identifier: string;
  status: string; // e.g. "ACTIVE", "ARCHIVED"
}
