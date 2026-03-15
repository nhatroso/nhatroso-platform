import {
  Contract,
  CreateContractInput,
  EndContractInput,
  Room,
  TenantLookupResult,
} from '@nhatroso/shared';

const API_BASE_URL = '/api/proxy';

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

export async function getContracts(): Promise<Contract[]> {
  const res = await apiFetch(`${API_BASE_URL}/contracts`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch contracts');
  }

  return res.json();
}

export async function getContract(id: string): Promise<Contract> {
  const res = await apiFetch(`${API_BASE_URL}/contracts/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch contract');
  }

  return res.json();
}

export async function getAvailableRooms(): Promise<Room[]> {
  const res = await apiFetch(`${API_BASE_URL}/rooms/available`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch available rooms');
  }

  return res.json();
}

export async function lookupTenantByPhone(
  phone: string,
): Promise<TenantLookupResult> {
  const res = await apiFetch(
    `${API_BASE_URL}/users/lookup?phone=${encodeURIComponent(phone)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!res.ok) {
    throw new Error('Failed to lookup tenant');
  }

  return res.json();
}

export async function createContract(
  data: CreateContractInput,
): Promise<Contract> {
  const res = await apiFetch(`${API_BASE_URL}/contracts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    if (res.status === 409) {
      throw new Error('CONTRACT_CONFLICT');
    }
    throw new Error(errBody?.error?.code || 'Failed to create contract');
  }

  return res.json();
}

export async function endContract(
  id: string,
  data: EndContractInput,
): Promise<Contract> {
  const res = await apiFetch(`${API_BASE_URL}/contracts/${id}/end`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.error?.code || 'Failed to end contract');
  }

  return res.json();
}
