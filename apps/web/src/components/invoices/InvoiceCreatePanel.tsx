import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Calculator, Save, X } from 'lucide-react';
import { getAllRooms } from '@/services/api/rooms';
import {
  calculateInvoice,
  createInvoice,
  InvoiceDetail,
} from '@/services/api/invoices';
import { Room } from '@nhatroso/shared';

interface InvoiceCreatePanelProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function InvoiceCreatePanel({
  onClose,
  onSuccess,
}: InvoiceCreatePanelProps) {
  const t = useTranslations('Invoices');
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = React.useState('');
  const [periodMonth, setPeriodMonth] = React.useState(
    new Date().toISOString().substring(0, 7), // Default to YYYY-MM
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [calculatedData, setCalculatedData] = React.useState<{
    room_code: string;
    tenant_name: string;
    details: { description: string; amount: string }[];
    total_amount: string;
  } | null>(null);

  React.useEffect(() => {
    getAllRooms()
      .then((data) => {
        // Only show occupied rooms for calculation as they have contracts
        setRooms(data.filter((r) => r.status === 'OCCUPIED'));
      })
      .catch(console.error);
  }, []);

  const handleCalculate = async () => {
    if (!selectedRoomId || !periodMonth) return;
    setIsCalculating(true);
    setError(null);
    setCalculatedData(null);
    try {
      const data = await calculateInvoice(selectedRoomId, periodMonth);
      setCalculatedData(data);
    } catch (err: unknown) {
      console.error('Failed to calculate invoice', err);
      setError(
        t('calculationFailed', {
          defaultValue:
            'Failed to calculate. Ensure room has active contract & tenant.',
        }),
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = async () => {
    if (!calculatedData) return;
    setIsLoading(true);
    try {
      await createInvoice({
        room_code: calculatedData.room_code,
        tenant_name: calculatedData.tenant_name,
        total_amount: calculatedData.total_amount,
        details: calculatedData.details as unknown as InvoiceDetail[],
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to create invoice', err);
    } finally {
      setIsLoading(false);
    }
  };

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
