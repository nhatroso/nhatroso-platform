import { apiClient } from './api';

export interface TenantRoomService {
  service_id: string;
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

export const userService = {
  getMyRoom: async (): Promise<TenantRoom> => {
    const response = await apiClient.get<TenantRoom>('/v1/me/room');
    return response.data;
  },
};
