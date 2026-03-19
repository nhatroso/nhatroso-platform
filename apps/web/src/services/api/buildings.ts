import {
  Building,
  CreateBuildingInput,
  UpdateBuildingInput,
  Floor,
  CreateFloorInput,
  UpdateFloorInput,
} from '@nhatroso/shared';
import { apiFetch, API_BASE_URL } from './base';

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

