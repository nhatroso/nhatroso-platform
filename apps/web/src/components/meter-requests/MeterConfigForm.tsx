'use client';

import { useMeterConfig } from '@/hooks/use-meter-config';
import { Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function MeterConfigForm() {
  const t = useTranslations('MeterRequests.Config');
  const { form, loading, saving, error, success, onSubmit } = useMeterConfig();

  const {
    register,
    watch,
    formState: { errors, isDirty },
  } = form;

  const autoGenerate = watch('auto_generate');

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl bg-gray-card border border-gray-border rounded-xl shadow-sm">
      <div className="p-4 sm:p-7">
        <div className="mb-8">
          <h2 className="text-h2 font-bold text-gray-text">{t('Title')}</h2>
          <p className="text-body text-gray-muted mt-1">{t('Description')}</p>
        </div>

        {error && (
          <div className="mb-4 bg-danger-light border border-danger-light text-danger rounded-lg p-4 flex items-center dark:bg-danger-dark/10 dark:border-danger-dark dark:text-danger-dark">
            <AlertCircle className="shrink-0 h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-success-light border border-success-light text-success rounded-lg p-4 flex items-center dark:bg-success-dark/10 dark:border-success-dark dark:text-success-dark">
            <CheckCircle2 className="shrink-0 h-4 w-4 mr-2" />
            {t('Success')}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-body font-medium text-gray-text">
                  {t('Enable')}
                </label>
                <p className="text-body text-gray-muted">{t('EnableDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  {...register('auto_generate')}
                />
                <div className="w-11 h-6 bg-gray-subtle peer-focus:outline-none ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div
              className={`transition-opacity duration-200 ${!autoGenerate ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-body font-medium mb-2 text-gray-text">
                    {t('DayOfMonth')}
                  </label>
                  <input
                    type="number"
                    className="py-3 px-4 block w-full border border-gray-border bg-gray-input rounded-lg text-body text-gray-text focus:border-primary focus:ring-primary"
                    placeholder="25"
                    {...register('day_of_month', { valueAsNumber: true })}
                  />
                  {errors.day_of_month && (
                    <p className="text-body text-danger mt-2">
                      {errors.day_of_month.message}
                    </p>
                  )}
                  <p className="text-body text-gray-muted mt-2">
                    {t('DayOfMonthDesc')}
                  </p>
                </div>

                <div>
                  <label className="block text-body font-medium mb-2 text-gray-text">
                    {t('GracePeriod')}
                  </label>
                  <input
                    type="number"
                    className="py-3 px-4 block w-full border border-gray-border bg-gray-input rounded-lg text-body text-gray-text focus:border-primary focus:ring-primary"
                    placeholder="5"
                    {...register('grace_days', { valueAsNumber: true })}
                  />
                  {errors.grace_days && (
                    <p className="text-body text-danger mt-2">
                      {errors.grace_days.message}
                    </p>
                  )}
                  <p className="text-body text-gray-muted mt-2">
                    {t('GracePeriodDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-gray-border">
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="w-full sm:w-auto inline-flex justify-center items-center gap-x-2 text-center bg-primary hover:bg-primary-hover text-white text-body font-medium rounded-lg px-6 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white transition dark:focus:ring-offset-gray-strong disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="shrink-0 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="shrink-0 h-4 w-4" />
                )}
                {t('Save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
