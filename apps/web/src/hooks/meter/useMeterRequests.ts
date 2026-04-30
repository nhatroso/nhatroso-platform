import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  meterAutomationService,
  MeterRequest,
} from '@/services/api/meter-automation';

export function useMeterRequests(periodMonth?: string) {
  const t = useTranslations('MeterRequests.Table');
  const [requests, setRequests] = React.useState<MeterRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await meterAutomationService.getMeterRequests(periodMonth);
      setRequests(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('FetchError');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [t, periodMonth]);

  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    refresh: fetchRequests,
  };
}
