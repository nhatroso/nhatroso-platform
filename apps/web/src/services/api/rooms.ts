import { Room, CreateRoomInput, UpdateRoomInput } from '@nhatroso/shared';
import { apiFetch } from './base';

export const roomsService = {
  getAllRooms: async (): Promise<Room[]> => {
    const res = await apiFetch(`/landlord/rooms`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to fetch all rooms');
    return res.json();
  },

  getRooms: async (floorId: string): Promise<Room[]> => {
    const res = await apiFetch(`/landlord/floors/${floorId}/rooms`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to fetch rooms');
    return res.json();
  },

  createRoom: async (floorId: string, data: CreateRoomInput): Promise<Room> => {
    const res = await apiFetch(`/landlord/floors/${floorId}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new Error(errBody?.error?.code || 'Failed to create room');
    }
    return res.json();
  },

  updateRoom: async (id: string, data: UpdateRoomInput): Promise<Room> => {
    const res = await apiFetch(`/landlord/rooms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new Error(errBody?.error?.code || 'Failed to update room');
    }
    return res.json();
  },

  getAvailableRooms: async (): Promise<Room[]> => {
    const res = await apiFetch(`/landlord/rooms/available`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to fetch available rooms');
    return res.json();
  },
};
