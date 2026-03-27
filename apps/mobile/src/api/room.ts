import { apiClient } from './client';

export interface TenantRoomService {
  name: string;
  unit: string;
  unit_price: string;
}

export interface TenantRoom {
  id: string;
  building_name: string;
  room_address: string;
  code: string;
  floor_name: string | null;
  monthly_rent: string;
  services: TenantRoomService[];
}

export const roomService = {
  getMyRoom: async (): Promise<TenantRoom> => {
    const response = await apiClient.get<TenantRoom>('/v1/tenant/room');
    return response.data;
  },
};
