export interface Meter {
  id: string;
  room_id: string;
  service_id: string;
  service_name?: string | null;
  service_unit?: string | null;
  serial_number: string | null;
  initial_reading: string; // Decimal as string
  latest_reading?: string | null; // Decimal as string
  latest_reading_date?: string | null; // ISO Date String
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export type MeterResponse = Meter;

export interface MeterReading {
  id: string;
  meter_id: string;
  reading_value: string; // Decimal as string
  reading_date: string;
  image_url: string | null;
  usage: string; // Decimal as string
  tenant_id: string | null;
  period_month: string | null;
  created_at: string;
}

export type MeterReadingResponse = MeterReading;

export interface CreateMeterInput {
  room_id: string;
  service_id: string;
  serial_number?: string | null;
  initial_reading?: string;
}

export interface RecordReadingParams {
  reading_value: string;
  reading_date?: string;
  image_url?: string | null;
  period_month?: string | null;
}

export type RecordReadingInput = RecordReadingParams;

export interface LandlordMeterSummary {
  total_meters: number;
  pending_readings: number;
  overdue_readings: number;
  submission_rate: number;
}

export interface LandlordMeterDetail {
  id: string;
  room_id: string;
  room_code: string;
  building_id: string;
  building_name: string;
  service_name: string;
  service_unit: string;
  serial_number: string | null;
  status: 'SUBMITTED' | 'PENDING' | 'OVERDUE';
  last_reading: string | null;
  last_reading_date: string | null;
}
