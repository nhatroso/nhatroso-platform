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

  getUploadUrl: async (): Promise<{ url: string; key: string }> => {
    const response = await apiClient.get<{ url: string; key: string }>(
      '/v1/meters/upload-url',
    );
    return response.data;
  },

  submitOcrReading: async (
    meterId: string,
    data: { image_url: string; period_month?: string },
  ): Promise<MeterReadingResponse> => {
    const response = await apiClient.post<MeterReadingResponse>(
      `/v1/meters/${meterId}/ocr`,
      data,
    );
    return response.data;
  },

  uploadToPresignedUrl: async (url: string, uri: string): Promise<void> => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload to S3 failed: ${uploadResponse.statusText}`);
    }
  },
};
