import * as React from 'react';
import { Invoice, getInvoices } from '@/services/api/invoices';

export function useInvoices() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);

  const fetchInvoices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to fetch invoices', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleCreateNew = () => {
    setIsCreating(true);
  };

  const handleClosePanel = () => {
    setIsCreating(false);
  };

  const handleSuccess = () => {
    fetchInvoices();
    if (isCreating) {
      setIsCreating(false);
    }
  };

  return {
    invoices,
    isLoading,
    isCreating,
    setIsCreating,
    fetchInvoices,
    handleCreateNew,
    handleClosePanel,
    handleSuccess,
  };
}
