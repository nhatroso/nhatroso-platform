import {
  Meter,
  MeterReading,
  CreateMeterInput,
  RecordReadingInput,
  LandlordMeterSummary,
  LandlordMeterDetail,
} from '@nhatroso/shared';
import { apiFetch } from './base';

export const metersApi = {
  listByRoom: async (roomId: string): Promise<Meter[]> => {
    const res = await apiFetch(`/meters/room/${roomId}`);
    if (!res.ok) throw new Error('Failed to fetch meters');
    return res.json();
  },

  create: async (data: CreateMeterInput): Promise<Meter> => {
    const res = await apiFetch(`/meters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create meter');
    return res.json();
  },

  listReadings: async (meterId: string): Promise<MeterReading[]> => {
    const res = await apiFetch(`/meters/${meterId}/readings`);
    if (!res.ok) throw new Error('Failed to fetch readings');
    return res.json();
  },

  recordReading: async (
    meterId: string,
    data: RecordReadingInput,
  ): Promise<MeterReading> => {
    const res = await apiFetch(`/meters/${meterId}/readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to record reading');
    return res.json();
  },

  getLandlordSummary: async (
    periodMonth?: string,
  ): Promise<LandlordMeterSummary> => {
    let url = `/meters/landlord/summary`;
    if (periodMonth) {
      url += `?period_month=${encodeURIComponent(periodMonth)}`;
    }
    const res = await apiFetch(url);
    if (!res.ok) throw new Error('Failed to fetch landlord summary');
    return res.json();
  },

  listLandlordMeters: async (
    buildingId?: string,
    periodMonth?: string,
  ): Promise<LandlordMeterDetail[]> => {
    let url = `/meters/landlord/list`;
    const params = new URLSearchParams();
    if (buildingId && buildingId !== 'all') {
      params.append('building_id', buildingId);
    }
    if (periodMonth) {
      params.append('period_month', periodMonth);
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const res = await apiFetch(url);
    if (!res.ok) throw new Error('Failed to list landlord meters');
    return res.json();
  },

  updateStatus: async (id: string, status: string): Promise<void> => {
    const res = await apiFetch(`/meters/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update meter status');
  },

  listLandlordReadings: async (params: {
    buildingId?: string;
    periodMonth?: string;
  }): Promise<LandlordMeterReadingDetail[]> => {
    const query = new URLSearchParams();
    if (params.buildingId && params.buildingId !== 'all')
      query.append('building_id', params.buildingId);
    if (params.periodMonth) query.append('period_month', params.periodMonth);
    const res = await apiFetch(
      `/meters/landlord/readings?${query.toString()}`,
    );
    if (!res.ok) throw new Error('Failed to fetch landlord readings');
    return res.json();
  },
};

export interface LandlordMeterReadingDetail {
  id: string;
  meter_id: string;
  room_code: string;
  building_name: string;
  service_name: string;
  service_unit: string;
  reading_value: number | null;
  usage: number | null;
  reading_date: string | null;
  period_month: string | null;
  image_url: string | null;
  status: string;
}
