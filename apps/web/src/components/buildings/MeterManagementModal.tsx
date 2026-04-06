import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Room } from '@nhatroso/shared';
import { useMeterManagement } from '@/hooks/use-meter-management';
import { getServiceDisplayName } from '@/lib/utils';
import {
  Activity,
  Calendar,
  Camera,
  History,
  Zap,
  Droplets,
  ChevronRight,
  TrendingUp,
  X,
} from 'lucide-react';

interface MeterManagementModalProps {
  room: Room;
  onClose: () => void;
}

export function MeterManagementModal({
  room,
  onClose,
}: MeterManagementModalProps) {
  const t = useTranslations('Buildings');
  const tServices = useTranslations('Services');

  const {
    meters,
    selectedMeter,
    readings,
    loading,
    submitting,
    newReadingValue,
    isRecording,
    setSelectedMeter,
    setNewReadingValue,
    setIsRecording,
    handleRecordReading,
  } = useMeterManagement(room);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-teal-100 p-2 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('MeterReading')} - {room.code}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('ManageUsageHistory')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[500px]">
          {/* Sidebar - Meters */}
          <div className="w-1/3 border-r border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-950/20">
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {t('AvailableMeters')}
            </h3>
            <div className="space-y-2">
              {meters.length === 0 && !loading && (
                <p className="text-center text-xs text-gray-400 py-8 italic">
                  {t('NoMetersFound')}
                </p>
              )}
              {meters.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMeter(m)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                    selectedMeter?.id === m.id
                      ? 'bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:ring-teal-800'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  {m.service_name?.toLowerCase().includes('electricity') ? (
                    <Zap size={18} />
                  ) : (
                    <Droplets size={18} />
                  )}
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-semibold">
                      {getServiceDisplayName(m.service_name || '', tServices)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content - Readings */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedMeter ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="rounded-full bg-gray-100 p-4 text-gray-300 dark:bg-gray-800">
                  <TrendingUp size={48} />
                </div>
                <h4 className="mt-4 text-sm font-semibold text-gray-500">
                  {t('SelectAMeterToView')}
                </h4>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Actions */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('UsageHistory')}
                  </h3>
                  {/* <button
                    onClick={() => setIsRecording(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-teal-700 active:scale-95 shadow-sm"
                  >
                    <Plus size={14} />
                    {t('NewReading')}
                  </button> */}
                </div>

                {/* Form to record */}
                {isRecording && (
                  <div className="rounded-xl border border-teal-100 bg-teal-50/30 p-4 dark:border-teal-900/30 dark:bg-teal-950/10 animate-in slide-in-from-top-2">
                    <div className="mb-3 flex items-center gap-2 text-teal-700 dark:text-teal-400">
                      <Camera size={16} />
                      <span className="text-xs font-bold uppercase tracking-wide">
                        {t('RecordNewUsage')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={newReadingValue}
                        onChange={(e) => setNewReadingValue(e.target.value)}
                        placeholder={t('EnterCurrentReading')}
                        className="block w-full rounded-lg border border-gray-200 bg-white p-2 text-sm text-gray-900 focus:border-teal-500 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        autoFocus
                      />
                      <button
                        onClick={handleRecordReading}
                        disabled={submitting || !newReadingValue}
                        className="rounded-lg bg-teal-600 px-4 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                      >
                        {t('Save')}
                      </button>
                      <button
                        onClick={() => setIsRecording(false)}
                        className="rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                      >
                        {t('Cancel')}
                      </button>
                    </div>
                  </div>
                )}

                {/* History List */}
                <div className="space-y-3">
                  {readings.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-400 opacity-60">
                      <History size={24} className="mx-auto mb-2 opacity-20" />
                      {t('NoReadingsYet')}
                    </div>
                  ) : (
                    readings.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-xl border border-gray-50 p-3 shadow-sm transition-all hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 dark:bg-gray-800">
                            <Calendar size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {r.reading_value}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {new Date(r.reading_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {r.usage && parseFloat(r.usage) > 0 && (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                            <ChevronRight size={12} className="text-gray-300" />
                            +{parseFloat(r.usage).toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
