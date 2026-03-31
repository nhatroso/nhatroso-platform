import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { meterService } from '@/src/api/meter';
import { roomService } from '@/src/api/room';

export function useServiceLabel() {
  const { t } = useTranslation();
  return (name?: string | null): string => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('điện') || lower.includes('electricity'))
      return t('Services.Predefined_electricity');
    if (lower.includes('nước') || lower.includes('water'))
      return t('Services.Predefined_water');
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

  const { data: room } = useQuery({
    queryKey: ['my-room'],
    queryFn: roomService.getMyRoom,
  });

  const activeRequest = Array.isArray(readingRequests)
    ? readingRequests.find((r) => r.status === 'OPEN')
    : null;

  const requiredServices = room?.services
    ? room.services.filter((s: any) => {
        const name = s.name?.toLowerCase() || '';
        return (
          name.includes('điện') ||
          name.includes('electricity') ||
          name.includes('nước') ||
          name.includes('water')
        );
      })
    : [];

  const completedServicesCount = requiredServices.filter((s: any) => {
    const sMeter = (meters || []).find(
      (m: any) => m.service_id === s.service_id,
    );
    return sMeter?.latest_reading_date
      ? new Date(sMeter.latest_reading_date).getMonth() ===
          (activeRequest?.month || new Date().getMonth() + 1) - 1 &&
          new Date(sMeter.latest_reading_date).getFullYear() ===
            (activeRequest?.year || new Date().getFullYear())
      : false;
  }).length;

  const isRequestCompleted =
    requiredServices.length > 0 &&
    completedServicesCount === requiredServices.length;

  return {
    meters,
    isLoadingMeters,
    activeRequest,
    isRequestCompleted,
  };
}
