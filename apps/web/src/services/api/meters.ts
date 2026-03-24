import {
  Meter,
  MeterReading,
  CreateMeterInput,
  RecordReadingInput,
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
};
