import { Room, CreateRoomInput, UpdateRoomInput } from '@nhatroso/shared';
import { apiFetch, API_BASE_URL } from './base';
export async function getAllRooms(): Promise<Room[]> {
  const res = await apiFetch(`${API_BASE_URL}/rooms`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch all rooms');
  return res.json();
}

export async function getRooms(floorId: string): Promise<Room[]> {
  const res = await apiFetch(`${API_BASE_URL}/floors/${floorId}/rooms`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch rooms');
  return res.json();
}

export async function createRoom(
  floorId: string,
  data: CreateRoomInput,
): Promise<Room> {
  const res = await apiFetch(`${API_BASE_URL}/floors/${floorId}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.error?.code || 'Failed to create room');
  }
  return res.json();
}

export async function updateRoom(
  id: string,
  data: UpdateRoomInput,
): Promise<Room> {
  const res = await apiFetch(`${API_BASE_URL}/rooms/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.error?.code || 'Failed to update room');
  }
  return res.json();
}

export async function getAvailableRooms(): Promise<Room[]> {
  const res = await apiFetch(`${API_BASE_URL}/rooms/available`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch available rooms');
  return res.json();
}
