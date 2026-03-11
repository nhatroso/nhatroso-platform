export interface Block {
  id: string; // uuid
  building_id: string; // uuid
  identifier: string;
  status: string; // e.g. "ACTIVE", "ARCHIVED"
}
