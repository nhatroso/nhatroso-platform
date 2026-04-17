import {
  RoomService,
  AssignServiceInput,
  UpdateAssignedServiceInput,
} from '@nhatroso/shared';
import { apiFetch } from './base';

export const roomServicesApi = {
  listByRoom: async (roomId: string): Promise<RoomService[]> => {
    const res = await apiFetch(`/rooms/${roomId}/services`);
    if (!res.ok) throw new Error('Failed to fetch assigned room services');
    return res.json();
  },

  assign: async (
    roomId: string,
    data: AssignServiceInput,
  ): Promise<RoomService> => {
    const res = await apiFetch(`/rooms/${roomId}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.code || 'Failed to assign service to room');
    }
    return res.json();
  },

  update: async (
    roomId: string,
    id: string,
    data: UpdateAssignedServiceInput,
  ): Promise<RoomService> => {
    const res = await apiFetch(
      `/rooms/${roomId}/services/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.code || 'Failed to update assigned service');
    }
    return res.json();
  },

  remove: async (roomId: string, id: string): Promise<void> => {
    const res = await apiFetch(
      `/rooms/${roomId}/services/${id}`,
      {
        method: 'DELETE',
      },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.code || 'Failed to remove assigned service');
    }
  },
};
