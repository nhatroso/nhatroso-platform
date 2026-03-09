export interface Building {
  id: string; // uuid
  owner_id: string; // uuid
  name: string;
  address: string | null;
  status: string; // e.g. "ACTIVE", "ARCHIVED"
  created_at: string;
  updated_at: string;
}
