import {
  Building,
  CreateBuildingInput,
  UpdateBuildingInput,
  Floor,
  CreateFloorInput,
  UpdateFloorInput,
} from '@nhatroso/shared';
import { apiFetch } from './base';

export const buildingsService = {
  getBuildings: async (): Promise<Building[]> => {
    const res = await apiFetch(`/landlord/buildings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch buildings');
    }

    return res.json();
  },

  createBuilding: async (data: CreateBuildingInput): Promise<Building> => {
    const res = await apiFetch(`/landlord/buildings`, {
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
  },

  updateBuilding: async (
    id: string,
    data: UpdateBuildingInput,
  ): Promise<Building> => {
    const res = await apiFetch(`/landlord/buildings/${id}`, {
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
  },

  archiveBuilding: async (id: string): Promise<Building> => {
    const res = await apiFetch(`/landlord/buildings/${id}/archive`, {
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
  },

  // ==========================================
  // FLOORS
  // ==========================================

  getAllFloors: async (): Promise<Floor[]> => {
    const res = await apiFetch(`/landlord/floors`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to fetch all floors');
    return res.json();
  },

  getFloors: async (buildingId: string): Promise<Floor[]> => {
    const res = await apiFetch(`/landlord/buildings/${buildingId}/floors`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to fetch floors');
    return res.json();
  },

  createFloor: async (
    buildingId: string,
    data: CreateFloorInput,
  ): Promise<Floor> => {
    const res = await apiFetch(`/landlord/buildings/${buildingId}/floors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create floor');
    return res.json();
  },

  updateFloor: async (id: string, data: UpdateFloorInput): Promise<Floor> => {
    const res = await apiFetch(`/landlord/floors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update floor');
    return res.json();
  },
};
