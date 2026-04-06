import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { meterService } from '@/src/api/meter';

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

  const activeRequest = Array.isArray(readingRequests)
    ? readingRequests.find((r) => r.status === 'PENDING' || r.status === 'LATE')
    : null;

  const isRequestCompleted = !activeRequest;

  return {
    meters,
    isLoadingMeters,
    activeRequest,
    isRequestCompleted,
  };
}
