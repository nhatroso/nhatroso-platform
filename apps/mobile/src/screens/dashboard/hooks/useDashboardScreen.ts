import { useQuery } from '@tanstack/react-query';
import { meterService } from '@/services/meter.service';
import { invoiceService } from '@/services/invoice.service';
export { useServiceLabel } from '@/hooks/useServiceLabel';

export function useDashboardScreen() {
  const {
    data: meters,
    isLoading: isLoadingMeters,
    refetch: refetchMeters,
  } = useQuery({
    queryKey: ['my-meters'],
    queryFn: meterService.getMyMeters,
  });

  const { data: readingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['my-reading-requests'],
    queryFn: meterService.getReadingRequests,
  });

  const {
    data: invoices,
    isLoading: isLoadingInvoices,
    refetch: refetchInvoices,
  } = useQuery({
    queryKey: ['my-invoices'],
    queryFn: invoiceService.getMyInvoices,
  });

  const activeRequest = Array.isArray(readingRequests)
    ? readingRequests.find((r) => r.status === 'PENDING')
    : null;

  const isRequestCompleted = !activeRequest;

  // Find all unpaid/partial invoices
  const unpaidInvoices = Array.isArray(invoices)
    ? invoices.filter((inv) => inv.status === 'UNPAID')
    : [];

  const totalUnpaidAmount = unpaidInvoices.reduce(
    (acc, inv) => acc + (Number(inv.total_amount) || 0),
    0,
  );

  const latestUnpaidInvoice =
    unpaidInvoices.length > 0 ? unpaidInvoices[0] : null;

  return {
    meters,
    isLoadingMeters,
    activeRequest,
    isRequestCompleted,
    latestUnpaidInvoice,
    totalUnpaidAmount,
    isLoadingInvoices,
    refetchAll: async () => {
      await Promise.all([
        refetchMeters(),
        refetchRequests(),
        refetchInvoices(),
      ]);
    },
  };
}
