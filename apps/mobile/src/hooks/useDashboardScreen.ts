import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { meterService } from '@/src/api/meter';
import { invoiceService } from '@/src/api/invoice';

export function useServiceLabel() {
  const { t } = useTranslation();
  return (name?: string | null): string => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('electricity'))
      return t('Services.Predefined_electricity');
    if (lower.includes('water')) return t('Services.Predefined_water');
    return name || '';
  };
}

export function useDashboardScreen() {
  const { data: meters, isLoading: isLoadingMeters } = useQuery({
    queryKey: ['my-meters'],
    queryFn: meterService.getMyMeters,
  });

  const { data: readingRequests } = useQuery({
    queryKey: ['my-reading-requests'],
    queryFn: meterService.getReadingRequests,
  });

  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
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
  };
}
