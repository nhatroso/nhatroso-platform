export interface Service {
  id: string;
  name: string;
  unit: string;
  status: 'ACTIVE' | 'ARCHIVED';
  created_at: string;
  updated_at: string;
}
