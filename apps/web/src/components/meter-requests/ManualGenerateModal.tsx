'use client';

import { useState, useEffect } from 'react';
import { generateManualRequests } from '@/services/api/meter-automation';
import { getBuildings } from '@/services/api/buildings';
import { Building } from '@nhatroso/shared';
import { Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ManualGenerateModalProps {
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export default function ManualGenerateModal({
  onClose,
  onSuccess,
}: ManualGenerateModalProps) {
  const t = useTranslations('MeterRequests.Manual');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingBuildings, setFetchingBuildings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [buildingId, setBuildingId] = useState('');

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [periodMonth, setPeriodMonth] = useState(currentMonth);

  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    async function loadBuildings() {
      try {
        const data = await getBuildings();
        setBuildings(data);
        if (data.length > 0) {
          setBuildingId(data[0].id);
        }
      } catch {
        setError(t('LoadBuildingsError'));
      } finally {
        setFetchingBuildings(false);
      }
    }
    loadBuildings();
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId || !periodMonth) {
      setError(t('ValidationError'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Local time end of day
      const d = new Date();
      const offset = -d.getTimezoneOffset();
      const sign = offset >= 0 ? '+' : '-';
      const pad = (num: number) => String(Math.abs(num)).padStart(2, '0');
      const tzString = `${sign}${pad(offset / 60)}:${pad(offset % 60)}`;
      const dueDateTime = `${dueDate}T23:59:59${tzString}`;

      const res = await generateManualRequests({
        building_id: buildingId,
        period_month: periodMonth,
        due_date: dueDateTime,
      });
      onSuccess(res.generated_count);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('GenerateError');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-strong/50 p-4">
      <div className="relative w-full max-w-md transform rounded-xl bg-gray-card p-6 shadow-2xl transition-all">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-gray-muted hover:bg-gray-surface"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="mb-4 text-h2 font-bold text-gray-text">{t('Title')}</h3>

        {error && (
          <div className="mb-4 rounded-md bg-danger-light p-3 text-body text-danger dark:bg-danger-dark/10 dark:text-danger-dark">
            {error}
          </div>
        )}

        {fetchingBuildings ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-body font-medium text-gray-muted">
                {t('Building')}
              </label>
              <select
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
                className="block w-full rounded-lg border-gray-border bg-gray-input px-4 py-2 text-body text-gray-text focus:border-primary focus:ring-primary"
              >
                <option value="" disabled>
                  {t('SelectBuilding')}
                </option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-body font-medium text-gray-muted">
                {t('Period')}
              </label>
              <input
                type="month"
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
                className="block w-full rounded-lg border-gray-border bg-gray-input px-4 py-2 text-body text-gray-text focus:border-primary focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-body font-medium text-gray-muted">
                {t('DueDate')}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="block w-full rounded-lg border-gray-border bg-gray-input px-4 py-2 text-body text-gray-text focus:border-primary focus:ring-primary"
              />
            </div>

            <div className="mt-6 flex justify-end gap-x-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-x-2 rounded-lg border border-gray-border bg-gray-card px-4 py-2 text-body font-medium text-gray-text shadow-sm hover:bg-gray-surface disabled:opacity-50"
              >
                {t('Cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-x-2 rounded-lg border border-transparent bg-primary px-4 py-2 text-body font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('Submit')
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
