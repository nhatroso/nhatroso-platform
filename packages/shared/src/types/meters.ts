export interface Meter {
  id: string;
  room_id: string;
  service_id: string;
  serial_number: string | null;
  initial_reading: string; // Decimal as string
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
}

export type RecordReadingInput = RecordReadingParams;
