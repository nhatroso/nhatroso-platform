import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Calculator, Save, X } from 'lucide-react';
import { useCreateInvoice } from '@/hooks/invoice/useCreateInvoice';

interface InvoiceCreatePanelProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function InvoiceCreatePanel({
  onClose,
  onSuccess,
}: InvoiceCreatePanelProps) {
  const t = useTranslations('Invoices');
  const {
    rooms,
    selectedRoomId,
    setSelectedRoomId,
    periodMonth,
    setPeriodMonth,
    graceDays,
    setGraceDays,
    isLoading,
    isCalculating,
    error,
    calculatedData,
    handleCalculate,
    handleSubmit,
  } = useCreateInvoice({ onSuccess });

  return (
    <div className="flex h-full w-full flex-col bg-gray-card shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-border p-6 bg-gray-surface/30">
        <div>
          <h2 className="text-h2 font-bold text-gray-text">
            {t('manualGeneration')}
          </h2>
          <p className="text-body text-gray-muted">
            {t('manualGenerationDesc')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-muted hover:text-gray-text hover:bg-gray-surface rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Form Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-body font-medium text-gray-muted mb-2 uppercase tracking-wider text-[11px]">
              {t('roomPrefix')}
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="block w-full rounded-xl border border-gray-border bg-gray-input p-3 text-body text-gray-text focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              <option value="">
                {t('select_room', { defaultValue: 'Select a room...' })}
              </option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.code}{' '}
                  {room.status === 'OCCUPIED' ? '' : `(${room.status})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-body font-medium text-gray-muted mb-2 uppercase tracking-wider text-[11px]">
              {t('period', { defaultValue: 'Billing Period' })}
            </label>
            <input
              type="month"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
              className="block w-full rounded-xl border border-gray-border bg-gray-input p-3 text-body text-gray-text focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-body font-medium text-gray-muted mb-2 uppercase tracking-wider text-[11px]">
              {t('graceDays', { defaultValue: 'Grace Days' })}
            </label>
            <select
              value={graceDays}
              onChange={(e) => setGraceDays(Number(e.target.value))}
              className="block w-full rounded-xl border border-gray-border bg-gray-input p-3 text-body text-gray-text focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCalculate}
            disabled={!selectedRoomId || isCalculating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-surface border border-gray-border p-3 font-bold text-gray-text hover:bg-gray-subtle active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            {isCalculating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4" />
            )}
            {t('calculate_btn', { defaultValue: 'Calculate Preview' })}
          </button>

          {error && (
            <div className="rounded-xl bg-danger-light p-4 text-tiny font-medium text-danger border border-danger-light/50 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
        </div>

        {/* Calculation Result */}
        {calculatedData && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="rounded-2xl bg-primary-light dark:bg-primary-dark/10 p-6 border border-primary-light dark:border-primary-dark/30 shadow-inner">
              <h3 className="font-semibold text-primary dark:text-primary-dark text-tiny uppercase tracking-widest">
                {t('totalAmount')}
              </h3>
              <p className="mt-2 text-h1 font-bold tracking-tight text-primary dark:text-primary-dark">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'VND',
                }).format(Number(calculatedData.total_amount))}
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-[11px] font-medium text-gray-muted uppercase tracking-wider">
                {t('breakdown')}
              </h3>
              <div className="rounded-xl border border-gray-border overflow-hidden divide-y divide-gray-border">
                {calculatedData.details.map((detail, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between p-4 bg-gray-surface/40 hover:bg-gray-surface/60 transition-colors"
                  >
                    <span className="text-gray-text font-medium">
                      {detail.description}
                    </span>
                    <span className="font-bold text-primary dark:text-primary-dark">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(Number(detail.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-border p-4 bg-gray-surface/20">
              <p className="text-tiny text-gray-muted uppercase tracking-wider font-medium mb-1">
                {t('tenantInfo')}
              </p>
              <p className="font-bold text-gray-text">
                {calculatedData.tenant_name}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-border p-6 bg-gray-surface/30">
        <button
          onClick={handleSubmit}
          disabled={!calculatedData || isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary p-4 font-bold text-white hover:bg-primary-hover active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {t('createInvoice', { defaultValue: 'Create Invoice' })}
        </button>
      </div>
    </div>
  );
}
