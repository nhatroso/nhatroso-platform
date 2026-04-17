'use client';

import { useAutoInvoiceConfig } from '@/hooks/use-auto-invoice-config';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';

export default function AutoInvoicesPage() {
  const t = useTranslations('Invoices.automation');
  const {
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
    onSubmit,
  } = useAutoInvoiceConfig();

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        variant="full"
        title={t('title')}
        description={t('description')}
      />

      <div className="bg-gray-card shadow-sm border border-gray-border rounded-2xl p-6">
        {error && (
          <div className="mb-4 bg-danger-light border border-danger-light text-danger rounded-lg p-4 flex items-center">
            <AlertCircle className="shrink-0 h-4 w-4 mr-2" />
            {t('error')}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-success-light border border-success-light text-success rounded-lg p-4 flex items-center">
            <CheckCircle2 className="shrink-0 h-4 w-4 mr-2" />
            {t('success')}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6 max-w-md">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={autoGenerate}
                  onChange={(e) => setAutoGenerate(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-surface border border-gray-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border-transparent"></div>
              </div>
              <span className="font-medium text-gray-text">{t('enable')}</span>
            </label>
          </div>

          {autoGenerate && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-muted">
                  {t('dayOfMonth')}
                </label>
                <select
                  className="bg-gray-input border border-gray-border text-gray-text rounded-lg text-sm focus:ring-primary focus:border-primary block w-full p-2.5"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-muted mt-1">
                  {t('dayOfMonthDesc')}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-muted">
                  {t('graceDays')}
                </label>
                <select
                  className="bg-gray-input border border-gray-border text-gray-text rounded-lg text-sm focus:ring-primary focus:border-primary block w-full p-2.5"
                  value={graceDays}
                  onChange={(e) => setGraceDays(Number(e.target.value))}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-muted mt-1">
                  {t('graceDaysDesc')}
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-border flex items-center gap-4">
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="bg-primary hover:bg-primary-hover text-white focus:ring-4 focus:outline-none focus:ring-primary/30 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center min-w-[120px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                t('save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
