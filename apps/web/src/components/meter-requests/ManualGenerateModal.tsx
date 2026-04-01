'use client';

import { useState, useEffect } from 'react';
import { generateManualRequests } from '@/services/api/meter-automation';
import { getBuildings } from '@/services/api/buildings';
import { Building } from '@nhatroso/shared';
import { Loader2, X } from 'lucide-react';

interface ManualGenerateModalProps {
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export default function ManualGenerateModal({
  onClose,
  onSuccess,
}: ManualGenerateModalProps) {
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
        setError('Không thể tải danh sách tòa nhà.');
      } finally {
        setFetchingBuildings(false);
      }
    }
    loadBuildings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId || !periodMonth) {
      setError('Vui lòng chọn tòa nhà và kỳ hạn (tháng).');
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
      const msg =
        err instanceof Error ? err.message : 'Lỗi khi tạo yêu cầu thủ công.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 p-4">
      <div className="relative w-full max-w-md transform rounded-xl bg-white p-6 shadow-2xl transition-all dark:bg-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          Tạo yêu cầu (Thủ công)
        </h3>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {fetchingBuildings ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tòa nhà
              </label>
              <select
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
                className="block w-full rounded-lg border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-400"
              >
                <option value="" disabled>
                  -- Chọn tòa nhà --
                </option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kỳ hạn (Tháng chốt số)
              </label>
              <input
                type="month"
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
                className="block w-full rounded-lg border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Hạn chốt sổ (Due Date)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="block w-full rounded-lg border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-400"
              />
            </div>

            <div className="mt-6 flex justify-end gap-x-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-x-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-slate-900 dark:text-white dark:hover:bg-gray-800"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-x-2 rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Tạo dữ liệu'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
