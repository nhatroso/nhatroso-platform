import * as React from 'react';
import { ContractResponse } from '@nhatroso/shared';
import { contractsService } from '@/services/api/contracts';

export function useContracts() {
  const [contracts, setContracts] = React.useState<ContractResponse[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchContracts = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await contractsService.list();
      setContracts(data);
    } catch (err) {
      console.error('Failed to fetch contracts', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  return {
    contracts,
    isLoading,
    error,
    refresh: fetchContracts,
  };
}
