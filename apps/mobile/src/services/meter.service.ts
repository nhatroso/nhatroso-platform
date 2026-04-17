import { apiClient } from './api';
import {
  MeterResponse,
  RecordReadingParams,
  MeterReadingResponse,
} from '@nhatroso/shared';

export const meterService = {
  getMyMeters: async (): Promise<MeterResponse[]> => {
    const response = await apiClient.get<MeterResponse[]>(
      '/v1/meters/my-meters',
    );
    return response.data;
  },

  createMeter: async (data: {
    room_id: string;
    service_id: string;
  }): Promise<MeterResponse> => {
    const response = await apiClient.post<MeterResponse>('/v1/meters', data);
    return response.data;
  },

  submitReading: async (
    meterId: string,
    data: RecordReadingParams,
  ): Promise<MeterReadingResponse> => {
    const response = await apiClient.post<MeterReadingResponse>(
      `/v1/meters/${meterId}/readings`,
      data,
    );
    return response.data;
  },

  getReadings: async (meterId: string): Promise<MeterReadingResponse[]> => {
    const response = await apiClient.get<MeterReadingResponse[]>(
      `/v1/meters/${meterId}/readings`,
    );
    return response.data;
  },

  getReadingRequests: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>(
      '/v1/meter-requests/my-requests',
    );
    return response.data;
  },

  uploadImage: async (uri: string): Promise<string> => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'upload.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    // @ts-ignore
    formData.append('file', {
      uri,
      name: filename,
      type,
    });

    const response = await apiClient.post<{ url: string }>(
      '/v1/uploads',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data.url;
  },
};
