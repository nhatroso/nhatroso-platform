import * as React from 'react';
import { useParams } from 'next/navigation';
import { contractsService } from '@/services/api/contracts';
import { ContractResponse } from '@nhatroso/shared';

export function useContractDetail() {
  const params = useParams();
  const contractId = params.id as string;
  const [contract, setContract] = React.useState<ContractResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMSG, setErrorMSG] = React.useState('');

  const fetchContract = React.useCallback(async () => {
    if (!contractId) return;
    try {
      setIsLoading(true);
      const data = await contractsService.getById(contractId);
      setContract(data);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMSG(error?.message || 'Failed to load contract');
    } finally {
      setIsLoading(false);
    }
  }, [contractId]);

  React.useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const handlePrint = () => {
    window.print();
  };

  return {
    contract,
    isLoading,
    errorMSG,
    handlePrint,
    refresh: fetchContract,
  };
}
