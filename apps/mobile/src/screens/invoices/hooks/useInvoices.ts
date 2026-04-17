import { useQuery } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoice.service';
import { useState } from 'react';

export const useInvoices = () => {
  const [refreshing, setRefreshing] = useState(false);

  const query = useQuery({
    queryKey: ['my-invoices'],
    queryFn: invoiceService.getMyInvoices,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await query.refetch();
    setRefreshing(false);
  };

  return {
    ...query,
    refreshing,
    onRefresh,
  };
};
