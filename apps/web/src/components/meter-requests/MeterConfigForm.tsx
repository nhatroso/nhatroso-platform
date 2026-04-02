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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="p-4 sm:p-7">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            {t('Title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('Description')}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-sm text-red-600 rounded-lg p-4 flex items-center dark:bg-red-800/10 dark:border-red-900 dark:text-red-500">
            <AlertCircle className="shrink-0 h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-teal-50 border border-teal-200 text-sm text-teal-600 rounded-lg p-4 flex items-center dark:bg-teal-800/10 dark:border-teal-900 dark:text-teal-500">
            <CheckCircle2 className="shrink-0 h-4 w-4 mr-2" />
            {t('Success')}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {t('Enable')}
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('EnableDesc')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  {...register('auto_generate')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none ring-0 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div
              className={`transition-opacity duration-200 ${!autoGenerate ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">
                    {t('DayOfMonth')}
                  </label>
                  <input
                    type="number"
                    className="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:focus:ring-gray-600"
                    placeholder="25"
                    {...register('day_of_month', { valueAsNumber: true })}
                  />
                  {errors.day_of_month && (
                    <p className="text-sm text-red-600 mt-2">
                      {errors.day_of_month.message}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    {t('DayOfMonthDesc')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">
                    {t('GracePeriod')}
                  </label>
                  <input
                    type="number"
                    className="py-3 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:focus:ring-gray-600"
                    placeholder="5"
                    {...register('grace_days', { valueAsNumber: true })}
                  />
                  {errors.grace_days && (
                    <p className="text-sm text-red-600 mt-2">
                      {errors.grace_days.message}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    {t('GracePeriodDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="w-full sm:w-auto inline-flex justify-center items-center gap-x-2 text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white transition dark:focus:ring-offset-gray-800 disabled:opacity-50"
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
