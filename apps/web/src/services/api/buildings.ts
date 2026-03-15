  import {
  Building,
  CreateBuildingInput,
  UpdateBuildingInput,
  Floor,
  CreateFloorInput,
  UpdateFloorInput,
  Room,
  CreateRoomInput,
  UpdateRoomInput,
} from '@nhatroso/shared';

const API_BASE_URL = '/api/proxy';

/**
 * Universal wrapper for API calls that auto-redirects to login on 401
 */
async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const localeMatch = pathname.match(/^\/(vi|en)/);
      const locale = localeMatch ? localeMatch[1] : '';
      window.location.href = locale ? `/${locale}/login` : '/login';
    }
  }

  return res;
}

export async function getBuildings(): Promise<Building[]> {
  const res = await apiFetch(`${API_BASE_URL}/buildings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch buildings');
  }

  return res.json();
}

export async function createBuilding(
  data: CreateBuildingInput,
): Promise<Building> {
  const res = await apiFetch(`${API_BASE_URL}/buildings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to create building');
  }

  return res.json();
}

export async function updateBuilding(
  id: string,
  data: UpdateBuildingInput,
): Promise<Building> {
  const res = await apiFetch(`${API_BASE_URL}/buildings/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    if (res.status === 409) {
      throw new Error('RESOURCE_ARCHIVED');
    }
    throw new Error('Failed to update building');
  }

  return res.json();
}

export async function archiveBuilding(id: string): Promise<Building> {
  const res = await apiFetch(`${API_BASE_URL}/buildings/${id}/archive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 409) {
      throw new Error('BUILDING_HAS_ACTIVE_ROOMS');
    }
    throw new Error('Failed to archive building');
  }

  return res.json();
}

// ==========================================
// FLOORS
// ==========================================

export async function getFloors(buildingId: string): Promise<Floor[]> {
  const res = await apiFetch(`${API_BASE_URL}/buildings/${buildingId}/floors`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch floors');
  return res.json();
}

export async function createFloor(
  buildingId: string,
  data: CreateFloorInput,
): Promise<Floor> {
  const res = await apiFetch(`${API_BASE_URL}/buildings/${buildingId}/floors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create floor');
  return res.json();
}

export async function updateFloor(
  id: string,
  data: UpdateFloorInput,
): Promise<Floor> {
  const res = await apiFetch(`${API_BASE_URL}/floors/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update floor');
  return res.json();
}

// ==========================================
// ROOMS
// ==========================================

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
