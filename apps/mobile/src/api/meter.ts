import { apiClient } from './client';
import {
  MeterResponse,
  RecordReadingParams,
  MeterReadingResponse,
} from '@nhatroso/shared';

export const meterService = {
  getMyMeters: async (): Promise<MeterResponse[]> => {
    const response = await apiClient.get<MeterResponse[]>('/meters/my-meters');
    return response.data;
  },

  submitReading: async (
    meterId: string,
    data: RecordReadingParams,
  ): Promise<MeterReadingResponse> => {
    const response = await apiClient.post<MeterReadingResponse>(
      `/meters/${meterId}/readings`,
      data,
    );
    return response.data;
  },

  getReadings: async (meterId: string): Promise<MeterReadingResponse[]> => {
    const response = await apiClient.get<MeterReadingResponse[]>(
      `/meters/${meterId}/readings`,
    );
    return response.data;
  },
};
