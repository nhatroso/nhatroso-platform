import {
  Building,
  CreateBuildingInput,
  UpdateBuildingInput,
} from '@nhatroso/shared';

const API_BASE_URL = '/api/proxy';

export async function getBuildings(): Promise<Building[]> {
  const res = await fetch(`${API_BASE_URL}/buildings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // Required to send and receive cookies (JWT token) across domains if applicable,
    // or same-origin. The Loco.rs backend uses HTTP-only cookies or Bearer tokens.
    // If using Bearer tokens stored in cookies:
    // credentials: 'include', // Uncomment if handling cookies directly
  });

  if (!res.ok) {
    throw new Error('Failed to fetch buildings');
  }

  return res.json();
}

export async function createBuilding(
  data: CreateBuildingInput,
): Promise<Building> {
  const res = await fetch(`${API_BASE_URL}/buildings`, {
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
  const res = await fetch(`${API_BASE_URL}/buildings/${id}`, {
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
  const res = await fetch(`${API_BASE_URL}/buildings/${id}/archive`, {
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
