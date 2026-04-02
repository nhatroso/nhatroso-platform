import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  getMeterRequests,
  MeterRequest,
} from '@/services/api/meter-automation';

export function useMeterRequests() {
  const t = useTranslations('MeterRequests.Table');
  const [requests, setRequests] = React.useState<MeterRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMeterRequests();
      setRequests(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('FetchError');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [t]);

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
