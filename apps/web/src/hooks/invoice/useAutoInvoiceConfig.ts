import * as React from 'react';
import { useTranslations } from 'next-intl';
import { autoInvoiceService } from '@/services/api/auto-invoice-configs';

export function useAutoInvoiceConfig() {
  const t = useTranslations('Invoices.automation');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const [autoGenerate, setAutoGenerate] = React.useState(false);
  const [dayOfMonth, setDayOfMonth] = React.useState(1);
  const [graceDays, setGraceDays] = React.useState(0);

  const [isDirty, setIsDirty] = React.useState(false);
  const [initialData, setInitialData] = React.useState<{
    auto_generate: boolean;
    day_of_month: number;
    grace_days: number;
  } | null>(null);

  const fetchConfig = React.useCallback(async () => {
    try {
      setLoading(true);
      const config = await autoInvoiceService.getAutoInvoiceConfig();
      if (config) {
        const data = {
          auto_generate: config.auto_generate,
          day_of_month: config.day_of_month,
          grace_days: config.grace_days,
        };
        setAutoGenerate(data.auto_generate);
        setDayOfMonth(data.day_of_month);
        setGraceDays(data.grace_days);
        setInitialData(data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('error');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  React.useEffect(() => {
    if (initialData) {
      const dirty =
        autoGenerate !== initialData.auto_generate ||
        dayOfMonth !== initialData.day_of_month ||
        graceDays !== initialData.grace_days;
      setIsDirty(dirty);
    }
  }, [autoGenerate, dayOfMonth, graceDays, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const data = {
        auto_generate: autoGenerate,
        day_of_month: dayOfMonth,
        grace_days: graceDays,
      };
      await autoInvoiceService.updateAutoInvoiceConfig(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setInitialData(data);
      setIsDirty(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('error');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    error,
    success,
    autoGenerate,
    setAutoGenerate,
    dayOfMonth,
    setDayOfMonth,
    graceDays,
    setGraceDays,
    isDirty,
    onSubmit: handleSubmit,
    refresh: fetchConfig,
  };
}
