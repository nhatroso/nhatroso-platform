import { apiFetch, API_BASE_URL } from './base';

export interface CreateReadingRequestInput {
  building_id: string;
  month: number;
  year: number;
}

export interface ReadingRequest {
  id: string;
  building_id: string;
  landlord_id: string;
  month: number;
  year: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function createReadingRequest(
  data: CreateReadingRequestInput,
): Promise<ReadingRequest> {
  const res = await apiFetch(`${API_BASE_URL}/reading-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    if (res.status === 409) {
      throw new Error('READING_REQUEST_ALREADY_EXISTS');
    }
    throw new Error('Failed to create reading request');
  }

  return res.json();
}

export async function getReadingRequestsByBuilding(
  buildingId: string,
): Promise<ReadingRequest[]> {
  const res = await apiFetch(
    `${API_BASE_URL}/reading-requests/building/${buildingId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!res.ok) {
    throw new Error('Failed to fetch reading requests');
  }

  return res.json();
}
