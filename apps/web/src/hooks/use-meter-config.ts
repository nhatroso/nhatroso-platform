import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import {
  getMeterConfig,
  updateMeterConfig,
} from '@/services/api/meter-automation';

const configSchema = z.object({
  day_of_month: z.number().min(1).max(31),
  grace_days: z.number().min(0).max(30),
  auto_generate: z.boolean(),
});

export type ConfigFormValues = z.infer<typeof configSchema>;

export function useMeterConfig() {
  const t = useTranslations('MeterRequests.Config');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      day_of_month: 25,
      grace_days: 5,
      auto_generate: true,
    },
  });

  const { reset } = form;

  const fetchConfig = React.useCallback(async () => {
    try {
      setLoading(true);
      const config = await getMeterConfig();
      if (config) {
        reset({
          day_of_month: config.day_of_month,
          grace_days: config.grace_days,
          auto_generate: config.auto_generate,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('LoadError');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [reset, t]);

  React.useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const onSubmit = async (data: ConfigFormValues) => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateMeterConfig(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      reset(data); // reset isDirty
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('SaveError');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    loading,
    saving,
    error,
    success,
    onSubmit: form.handleSubmit(onSubmit),
    refresh: fetchConfig,
  };
}
