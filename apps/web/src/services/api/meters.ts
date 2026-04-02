import {
  Meter,
  MeterReading,
  CreateMeterInput,
  RecordReadingInput,
  LandlordMeterSummary,
  LandlordMeterDetail,
} from '@nhatroso/shared';
import { apiFetch, API_BASE_URL } from './base';

export const metersApi = {
  listByRoom: async (roomId: string): Promise<Meter[]> => {
    const res = await apiFetch(`${API_BASE_URL}/meters/room/${roomId}`);
    if (!res.ok) throw new Error('Failed to fetch meters');
    return res.json();
  },

  create: async (data: CreateMeterInput): Promise<Meter> => {
    const res = await apiFetch(`${API_BASE_URL}/meters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create meter');
    return res.json();
  },

  listReadings: async (meterId: string): Promise<MeterReading[]> => {
    const res = await apiFetch(`${API_BASE_URL}/meters/${meterId}/readings`);
    if (!res.ok) throw new Error('Failed to fetch readings');
    return res.json();
  },

  recordReading: async (
    meterId: string,
    data: RecordReadingInput,
  ): Promise<MeterReading> => {
    const res = await apiFetch(`${API_BASE_URL}/meters/${meterId}/readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to record reading');
    return res.json();
  },

  getLandlordSummary: async (): Promise<LandlordMeterSummary> => {
    const res = await apiFetch(`${API_BASE_URL}/meters/landlord/summary`);
    if (!res.ok) throw new Error('Failed to fetch landlord summary');
    return res.json();
  },

  listLandlordMeters: async (
    buildingId?: string,
  ): Promise<LandlordMeterDetail[]> => {
    const url = buildingId
      ? `${API_BASE_URL}/meters/landlord/list?building_id=${buildingId}`
      : `${API_BASE_URL}/meters/landlord/list`;
    const res = await apiFetch(url);
    if (!res.ok) throw new Error('Failed to list landlord meters');
    return res.json();
  },

  updateStatus: async (id: string, status: string): Promise<void> => {
    const res = await apiFetch(`${API_BASE_URL}/meters/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update meter status');
  },
};
